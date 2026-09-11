import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisVectors } from '../types';

export type MicPermissionState = 'prompt' | 'granted' | 'denied';

export interface VerdictData {
  chunk_id?: number | string;
  chunk_index?: number;
  risk_score: number;
  verdict: 'Verified' | 'Suspicious' | 'Deepfake';
  vector_status: 'Clear' | 'Investigating' | 'Threat Detected';
  action_taken: 'Allowed' | 'Flagged' | 'Terminated';
  alert_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  confidence?: number;
  vectors: AnalysisVectors;
  features?: any;
  metrics?: {
    frequency_hz: number;
    amplitude_db: number;
    jitter: number;
    shimmer: number;
  };
  timings?: {
    parse_ms?: number;
    features_ms?: number;
    inference_ms?: number;
    risk_scoring_ms?: number;
    db_logging_ms?: number;
    backend_total_ms?: number;
  };
  latency_e2e_ms?: number;
  log_id?: number;
  caller_id?: string;
  timestamp?: string;
}

interface UseVoiceStreamOptions {
  windowDurationMs?: number; // rolling window chunk interval (default: 1500ms)
  overlapDurationMs?: number; // overlap buffer with previous chunk (default: 500ms)
  callerId?: string;
  onVerdict?: (verdict: VerdictData) => void;
  onAudioMetrics?: (metrics: { freqHz: number; ampDb: number; volume: number }) => void;
  onError?: (errorMessage: string) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

/**
 * Converts Float32Array PCM samples at a given sample rate into a 16-bit 16kHz PCM WAV ArrayBuffer.
 */
function encodeWav16k16bit(samples: Float32Array, inputSampleRate: number): ArrayBuffer {
  const targetSampleRate = 16000;
  let resampled: Float32Array;

  if (inputSampleRate === targetSampleRate) {
    resampled = samples;
  } else {
    // Linear interpolation resampling to 16kHz
    const ratio = inputSampleRate / targetSampleRate;
    const newLength = Math.round(samples.length / ratio);
    resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const origIndex = i * ratio;
      const index = Math.floor(origIndex);
      const frac = origIndex - index;
      const s0 = samples[index] || 0;
      const s1 = samples[index + 1] || s0;
      resampled[i] = s0 + frac * (s1 - s0);
    }
  }

  // Generate 44-byte WAV header + 16-bit PCM data
  const buffer = new ArrayBuffer(44 + resampled.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier 'RIFF'
  view.setUint32(0, 0x52494646, false);
  // File length minus 8 bytes
  view.setUint32(4, 36 + resampled.length * 2, true);
  // 'WAVE'
  view.setUint32(8, 0x57415645, false);
  // 'fmt ' chunk
  view.setUint32(12, 0x666d7420, false);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true);
  // NumChannels (1 = mono)
  view.setUint16(22, 1, true);
  // SampleRate (16000)
  view.setUint32(24, targetSampleRate, true);
  // ByteRate (SampleRate * NumChannels * BitsPerSample/8) = 16000 * 1 * 2 = 32000
  view.setUint32(28, targetSampleRate * 2, true);
  // BlockAlign (NumChannels * BitsPerSample/8) = 2
  view.setUint16(32, 2, true);
  // BitsPerSample (16)
  view.setUint16(34, 16, true);
  // 'data' chunk
  view.setUint32(36, 0x64617461, false);
  // Subchunk2Size (data length in bytes)
  view.setUint32(40, resampled.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < resampled.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useVoiceStream(options: UseVoiceStreamOptions = {}) {
  const {
    windowDurationMs = 1500, // 1.5s target chunk interval
    overlapDurationMs = 500, // 500ms sliding window overlap
    callerId = 'MIC_STREAM_LIVE',
    onVerdict,
    onAudioMetrics,
    onError,
    onConnectionChange
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permissionState, setPermissionState] = useState<MicPermissionState>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmBufferRef = useRef<Float32Array[]>([]);
  const overlapBufferRef = useRef<Float32Array[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const chunkCountRef = useRef(0);
  const pendingChunksRef = useRef<Map<number, number>>(new Map());
  const analyzingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check initial permission status if supported by browser
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state as MicPermissionState);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as MicPermissionState);
          };
        })
        .catch(() => {
          setPermissionState('prompt');
        });
    }
  }, []);

  const stopLiveDetection = useCallback(() => {
    console.log('[VoiceGuard Dev] Stopping live microphone detection...');

    // 1. Stop audio processing nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // 2. Stop microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // 3. Stop visualizer animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (analyzingTimeoutRef.current) {
      clearTimeout(analyzingTimeoutRef.current);
      analyzingTimeoutRef.current = null;
    }

    // 4. Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    pcmBufferRef.current = [];
    overlapBufferRef.current = [];
    chunkCountRef.current = 0;
    pendingChunksRef.current.clear();
    setIsRecording(false);
    setIsAnalyzing(false);
    setWsConnected(false);
    if (onConnectionChange) onConnectionChange(false);
  }, [onConnectionChange]);

  const startLiveDetection = useCallback(async () => {
    setErrorMessage(null);
    chunkCountRef.current = 0;
    pendingChunksRef.current.clear();
    console.log('[VoiceGuard Dev] Initiating live microphone detection with 1.5s sliding window...');

    // 1. Request microphone access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // retain natural acoustics for spoof analysis
          autoGainControl: true
        }
      });
      setPermissionState('granted');
      mediaStreamRef.current = stream;
      console.log('[VoiceGuard Dev] Microphone access granted.');
    } catch (err: any) {
      setPermissionState('denied');
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone access was denied. Please enable microphone permission in your browser URL bar and try again.'
        : `Could not access microphone: ${err.message || err.name}`;
      setErrorMessage(msg);
      console.error('[VoiceGuard Dev] Microphone error:', msg);
      if (onError) onError(msg);
      return;
    }

    // 2. Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDevVitePort = window.location.port === '5173' || window.location.port === '3000';
    const wsHost = isDevVitePort ? `${window.location.hostname}:8000` : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/stream`;

    console.log(`[VoiceGuard Dev] Connecting WebSocket to: ${wsUrl}`);
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (e: any) {
      const errStr = `Failed to create WebSocket to ${wsUrl}: ${e.message}`;
      setErrorMessage(errStr);
      if (onError) onError(errStr);
      return;
    }

    ws.onopen = () => {
      console.log('[VoiceGuard Dev] WebSocket connected successfully to /ws/stream.');
      setWsConnected(true);
      if (onConnectionChange) onConnectionChange(true);

      ws.send(JSON.stringify({
        type: 'start_mic',
        caller_id: callerId,
        window_ms: windowDurationMs
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'mic_verdict' || data.type === 'verdict_update') {
          // Calculate precise end-to-end latency
          const chunkId = data.chunk_id || data.chunk_index;
          let deltaMs: number | null = null;
          
          if (chunkId && pendingChunksRef.current.has(chunkId)) {
            const sentTime = pendingChunksRef.current.get(chunkId)!;
            deltaMs = performance.now() - sentTime;
            pendingChunksRef.current.delete(chunkId);
            setLastLatencyMs(Math.round(deltaMs));
          }

          setIsAnalyzing(false);

          // Measurable dev latency logging
          const backendMs = data.timings?.backend_total_ms;
          const latencyStr = deltaMs !== null ? `${deltaMs.toFixed(1)} ms` : 'N/A';
          console.log(
            `%c[VoiceGuard Latency] ⚡ Chunk #${chunkId} E2E: ${latencyStr} | Backend: ${backendMs ?? '?'} ms (features: ${data.timings?.features_ms ?? 0}ms, inference: ${data.timings?.inference_ms ?? 0}ms)`,
            'color: #0d9488; font-weight: bold; background: #f0fdfa; padding: 2px 6px; border-radius: 4px;'
          );

          if (onVerdict) {
            onVerdict({
              ...data,
              latency_e2e_ms: deltaMs ? Math.round(deltaMs) : undefined
            });
          }
        } else if (data.type === 'error') {
          setIsAnalyzing(false);
          console.error('[VoiceGuard Dev] Backend WebSocket error:', data.message);
          if (onError) onError(`Backend Analysis Error: ${data.message}`);
        }
      } catch (e) {
        console.error('[VoiceGuard Dev] Error parsing WebSocket JSON payload:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('[VoiceGuard Dev] WebSocket error:', err);
      const errMsg = 'WebSocket connection error: Could not reach real-time analysis server (ws://localhost:8000/ws/stream).';
      setErrorMessage(errMsg);
      if (onError) onError(errMsg);
    };

    ws.onclose = () => {
      console.log('[VoiceGuard Dev] WebSocket connection closed.');
      setWsConnected(false);
      setIsAnalyzing(false);
      if (onConnectionChange) onConnectionChange(false);
    };

    // 3. Audio Context & Processing Graph
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('[VoiceGuard Dev] AudioContext resumed.');
    }

    const sourceNode = audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    analyserRef.current = analyserNode;

    const processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processorNode;

    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0; // Mute local feedback

    sourceNode.connect(analyserNode);
    analyserNode.connect(processorNode);
    processorNode.connect(silentGain);
    silentGain.connect(audioContext.destination);

    pcmBufferRef.current = [];
    overlapBufferRef.current = [];
    let lastChunkSentTime = performance.now();

    processorNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(inputData);
      pcmBufferRef.current.push(copy);

      const now = performance.now();
      if (now - lastChunkSentTime >= windowDurationMs) {
        lastChunkSentTime = now;

        // Combine overlap buffer from previous window + newly recorded audio
        const combined = [...overlapBufferRef.current, ...pcmBufferRef.current];
        const totalSamples = combined.reduce((acc, curr) => acc + curr.length, 0);

        if (totalSamples > 0) {
          const merged = new Float32Array(totalSamples);
          let offset = 0;
          for (const buf of combined) {
            merged.set(buf, offset);
            offset += buf.length;
          }

          // Retain the last 500ms of audio in overlapBuffer for smooth continuous sliding window
          const overlapSampleCount = Math.round((overlapDurationMs / 1000) * audioContext.sampleRate);
          const overlapSlice = merged.slice(Math.max(0, merged.length - overlapSampleCount));
          overlapBufferRef.current = [overlapSlice];
          pcmBufferRef.current = [];

          // Encode to 16kHz 16-bit PCM WAV
          const wavBuffer = encodeWav16k16bit(merged, audioContext.sampleRate);
          const wavB64 = arrayBufferToBase64(wavBuffer);
          
          chunkCountRef.current += 1;
          const currentChunkId = chunkCountRef.current;
          const chunkSendTimestamp = performance.now();
          pendingChunksRef.current.set(currentChunkId, chunkSendTimestamp);

          // Instantly trigger client-side "Analyzing..." feedback so UI is immediately responsive
          setIsAnalyzing(true);
          if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
          analyzingTimeoutRef.current = setTimeout(() => {
            setIsAnalyzing(false);
          }, 2200);

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'mic_chunk',
              chunk_id: currentChunkId,
              data: wavB64,
              caller_id: callerId,
              client_ts: Date.now()
            }));
          } else {
            console.warn(`[VoiceGuard Dev] WebSocket not in OPEN state (readyState: ${ws.readyState}), skipped chunk #${currentChunkId}`);
          }
        }
      }
    };

    // 4. Real-time visualizer audio level loop
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const updateMetrics = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      let maxVal = 0;
      let dominantFreqIndex = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
        if (dataArray[i] > maxVal) {
          maxVal = dataArray[i];
          dominantFreqIndex = i;
        }
      }

      const avg = sum / dataArray.length;
      const volume = avg / 255;
      const nyquist = audioContext.sampleRate / 2;
      const freqHz = (dominantFreqIndex / dataArray.length) * (nyquist / 2);
      const ampDb = Math.round((volume * 40) - 20);

      if (onAudioMetrics) {
        onAudioMetrics({
          freqHz: Math.max(80, Math.round(freqHz)),
          ampDb,
          volume
        });
      }

      animationFrameRef.current = requestAnimationFrame(updateMetrics);
    };

    updateMetrics();
    setIsRecording(true);
  }, [callerId, windowDurationMs, overlapDurationMs, onVerdict, onAudioMetrics, onError, onConnectionChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLiveDetection();
    };
  }, [stopLiveDetection]);

  return {
    isRecording,
    isAnalyzing,
    lastLatencyMs,
    wsConnected,
    permissionState,
    errorMessage,
    startLiveDetection,
    stopLiveDetection
  };
}
