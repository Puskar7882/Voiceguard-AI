import React, { useEffect, useState, useCallback } from 'react';
import { 
  AlertOctagon, 
  ShieldCheck, 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  Upload, 
  PhoneOff, 
  Radio, 
  Sliders, 
  RefreshCw, 
  Clock, 
  Globe, 
  Lock, 
  AlertTriangle, 
  Info, 
  X, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { WaveformVisualizer } from '../components/visualizer/WaveformVisualizer';
import { AnalysisVectorsPanel } from '../components/dashboard/AnalysisVectorsPanel';
import { RecentLogsTable } from '../components/dashboard/RecentLogsTable';
import { ThreatFeed } from '../components/dashboard/ThreatFeed';
import { DetectionSettings } from '../components/dashboard/DetectionSettings';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { BrandLoader } from '../components/common/BrandLoader';
import { fetchLogs, analyzeAudio } from '../services/api';
import { useVoiceStream, VerdictData } from '../hooks/useVoiceStream';
import { AnalysisVectors, DetectionLogItem } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Live session state
  const [callerId, setCallerId] = useState('INT_44021');
  const [sourceIP, setSourceIP] = useState('192.168.1.104');
  const [riskScore, setRiskScore] = useState(88.0);
  const [verdict, setVerdict] = useState<'Verified' | 'Suspicious' | 'Deepfake'>('Deepfake');
  const [vectorStatus, setVectorStatus] = useState<'Clear' | 'Investigating' | 'Threat Detected'>('Threat Detected');
  const [actionTaken, setActionTaken] = useState<'Allowed' | 'Flagged' | 'Terminated'>('Terminated');
  const [recommendation, setRecommendation] = useState(
    'CRITICAL: Synthetic voice clone detected. Terminate connection immediately and require in-branch biometric or registered out-of-band OTP verification.'
  );

  // Audio & Waveform state
  const [isStreaming, setIsStreaming] = useState(false);
  const [freqHz, setFreqHz] = useState(440.0);
  const [ampDb, setAmpDb] = useState(2.4);
  const [liveVolume, setLiveVolume] = useState(0.0);
  const [durationSeconds, setDurationSeconds] = useState(164);
  const [isTerminated, setIsTerminated] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Analysis Vectors
  const [vectors, setVectors] = useState<AnalysisVectors>({
    acoustic_anomaly: {
      score: 92.0,
      status: 'Threat Detected',
      detail: 'Synthetic signature match found in spectral envelope.'
    },
    prosody_score: {
      score: 65.0,
      status: 'Investigating',
      detail: 'Irregular intonation patterns compared to baseline model.'
    },
    cross_session_link: {
      score: 12.0,
      status: 'Clear',
      detail: 'No known malicious sessions linked to this endpoint.'
    }
  });

  // Settings & Logs state
  const [highSensitivity, setHighSensitivity] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [logs, setLogs] = useState<DetectionLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load initial historical logs
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await fetchLogs(15, 0);
      setLogs(data.logs);
    } catch (e) {
      console.error('[VoiceGuard] Error loading historical logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Handle live microphone verdicts
  const handleMicVerdict = useCallback((data: VerdictData) => {
    console.log('[VoiceGuard UI] Applying live verdict to dashboard:', data);
    setRiskScore(data.risk_score);
    setVerdict(data.verdict);
    setVectorStatus(data.vector_status);
    setActionTaken(data.action_taken);
    if (data.recommendation) setRecommendation(data.recommendation);
    if (data.vectors) setVectors(data.vectors);

    if (data.metrics) {
      if (data.metrics.frequency_hz) setFreqHz(data.metrics.frequency_hz);
      if (data.metrics.amplitude_db) setAmpDb(data.metrics.amplitude_db);
    }

    // Append new log item to Recent Logs table in real-time
    const newLogItem: DetectionLogItem = {
      id: data.log_id || Date.now(),
      timestamp: data.timestamp || new Date().toISOString(),
      time_formatted: new Date().toLocaleTimeString() + ' GMT',
      caller_id: data.caller_id || 'LIVE_MIC_USER',
      risk_score: data.risk_score,
      verdict: data.verdict,
      vector_status: data.vector_status,
      action_taken: data.action_taken,
      spectral_anomaly: data.vectors?.acoustic_anomaly?.score || 0,
      prosody_score: data.vectors?.prosody_score?.score || 0,
      cross_session_link: data.vectors?.cross_session_link?.score || 0,
      features: data.features
    };

    setLogs(prev => [newLogItem, ...prev.slice(0, 19)]);
  }, []);

  const handleAudioMetrics = useCallback((metrics: { freqHz: number; ampDb: number; volume: number }) => {
    setFreqHz(metrics.freqHz);
    setAmpDb(metrics.ampDb);
    setLiveVolume(metrics.volume);
  }, []);

  const handleStreamError = useCallback((errStr: string) => {
    console.error('[VoiceGuard UI] Stream error:', errStr);
    setActiveAlert(errStr);
  }, []);

  // Custom Live Microphone Stream Hook (1.5s sliding window, 500ms overlap)
  const {
    isRecording,
    isAnalyzing,
    lastLatencyMs,
    wsConnected,
    permissionState,
    errorMessage: micError,
    startLiveDetection,
    stopLiveDetection
  } = useVoiceStream({
    windowDurationMs: 1500,
    overlapDurationMs: 500,
    callerId: 'LIVE_MIC_STREAM',
    onVerdict: handleMicVerdict,
    onAudioMetrics: handleAudioMetrics,
    onError: handleStreamError
  });

  const toggleLiveMic = () => {
    setActiveAlert(null);
    if (isRecording) {
      stopLiveDetection();
    } else {
      setIsTerminated(false);
      setCallerId('LIVE_MIC_STREAM');
      setSourceIP('127.0.0.1 (Local Mic)');
      setDurationSeconds(0);
      startLiveDetection();
    }
  };

  // Call duration counter
  useEffect(() => {
    if ((!isStreaming && !isRecording) || isTerminated) return;
    const interval = setInterval(() => {
      setDurationSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, isRecording, isTerminated]);

  // Preset Scenario switch handler
  const setScenario = (type: 'deepfake' | 'genuine' | 'borderline') => {
    setActiveAlert(null);
    if (isRecording) {
      stopLiveDetection();
    }
    setIsTerminated(false);
    setIsStreaming(true);
    setDurationSeconds(0);

    if (type === 'deepfake') {
      setCallerId('INT_44021');
      setSourceIP('192.168.1.104');
      setRiskScore(88.0);
      setVerdict('Deepfake');
      setVectorStatus('Threat Detected');
      setActionTaken('Terminated');
      setRecommendation('CRITICAL: Synthetic voice clone detected. Terminate connection immediately and require out-of-band OTP.');
      setVectors({
        acoustic_anomaly: { score: 92.0, status: 'Threat Detected', detail: 'Synthetic signature match found in spectral envelope.' },
        prosody_score: { score: 65.0, status: 'Investigating', detail: 'Irregular intonation patterns compared to baseline model.' },
        cross_session_link: { score: 12.0, status: 'Clear', detail: 'No known malicious sessions linked to this endpoint.' }
      });
    } else if (type === 'genuine') {
      setCallerId('UNK_88291');
      setSourceIP('172.16.42.18');
      setRiskScore(12.0);
      setVerdict('Verified');
      setVectorStatus('Clear');
      setActionTaken('Allowed');
      setRecommendation('AUTHENTIC: Voice acoustic and prosodic profiles match organic human characteristics.');
      setVectors({
        acoustic_anomaly: { score: 8.5, status: 'Clear', detail: 'Natural human vocal tract formants verified.' },
        prosody_score: { score: 14.0, status: 'Clear', detail: 'Natural conversational cadence and micro-vibrato detected.' },
        cross_session_link: { score: 5.0, status: 'Clear', detail: 'Clean historical trust reputation.' }
      });
    } else {
      setCallerId('EXT_99210');
      setSourceIP('10.0.8.99');
      setRiskScore(45.0);
      setVerdict('Suspicious');
      setVectorStatus('Investigating');
      setActionTaken('Flagged');
      setRecommendation('WARNING: Bandwidth-compressed voice signal. Step-up OTP authentication advised.');
      setVectors({
        acoustic_anomaly: { score: 48.0, status: 'Investigating', detail: 'Elevated noise floor and harmonic compression.' },
        prosody_score: { score: 62.0, status: 'Investigating', detail: 'Irregular pitch variations detected.' },
        cross_session_link: { score: 15.0, status: 'Clear', detail: 'Session flagged for analyst verification.' }
      });
    }
  };

  const handleTerminate = () => {
    if (isRecording) {
      stopLiveDetection();
    }
    setIsTerminated(true);
    setIsStreaming(false);
    setActionTaken('Terminated');
    setRecommendation('SESSION TERMINATED: Telephony stream severed. Out-of-band authentication dispatched.');
    loadLogs();
  };

  const formatDuration = (sec: number) => {
    const mins = String(Math.floor(sec / 60)).padStart(2, '0');
    const secs = String(sec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Upload local file for direct analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isRecording) stopLiveDetection();

    try {
      setIsStreaming(true);
      const res = await analyzeAudio(file, `UPLOAD_${file.name.substring(0, 8)}`, 'standard_call');
      setCallerId(res.caller_id);
      setRiskScore(res.risk_score);
      setVerdict(res.verdict);
      setVectorStatus(res.vector_status);
      setActionTaken(res.action_taken);
      setRecommendation(res.recommendation);
      setVectors(res.vectors);
      loadLogs();
    } catch (err: any) {
      setActiveAlert(err.message || 'Error processing uploaded WAV file.');
    }
  };

  const isThreat = riskScore >= riskThreshold;

  return (
    <div className="flex flex-col w-full p-4 md:p-gutter gap-6 max-w-container-max mx-auto">
      
      {/* Visible Error / Toast Notification */}
      {(activeAlert || micError) && (
        <div className="p-4 bg-error-container/80 border-2 border-error rounded-xl text-on-error-container font-mono text-xs flex items-center justify-between gap-3 animate-slide-up shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <span className="font-semibold">{activeAlert || micError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveAlert(null);
                startLiveDetection();
              }}
              className="px-3 py-1 bg-error text-white rounded-md font-mono text-xs hover:bg-on-error-container transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1 text-on-error-container hover:bg-error/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Live Microphone Detection Control Bar */}
      <div className="bg-surface-container-lowest p-4 md:p-5 rounded-xl border-2 border-secondary/30 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-surface-container-lowest to-secondary-container/10">
        <div className="flex flex-wrap items-center gap-3.5">
          <button
            onClick={toggleLiveMic}
            className={`px-5 py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 flex items-center gap-2.5 shadow-md ${
              isRecording
                ? 'bg-error text-white hover:bg-on-error-container animate-pulse ring-4 ring-error/20'
                : 'bg-secondary text-white hover:bg-[#0b8277] ring-4 ring-secondary/20 hover:shadow-lg'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Live Detection</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Live Detection</span>
              </>
            )}
          </button>

          {isRecording && (
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
              </span>
              <span className="font-mono text-xs font-bold text-error uppercase flex items-center gap-1.5">
                <span>Capturing & Analyzing (2s Windows)</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                wsConnected ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-amber-100 text-amber-900'
              }`}>
                {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {wsConnected ? 'WS Stream Synced' : 'Connecting Socket...'}
              </span>
            </div>
          )}

          {!isRecording && (
            <span className="font-mono text-xs text-on-surface-variant">
              Click to speak and detect voice clone authenticity live
            </span>
          )}
        </div>

        {/* DPDP Consent Notice */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/40">
          <Info className="w-4 h-4 text-secondary shrink-0" />
          <span>DPDP Act Private: Audio is analyzed in volatile RAM and discarded post-verdict.</span>
        </div>
      </div>

      {/* Simulation Scenario Quick Bar */}
      <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary uppercase flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-secondary" />
            Preset Telephony Feeds:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScenario('deepfake')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              callerId === 'INT_44021' && !isRecording
                ? 'bg-error text-white shadow-sm'
                : 'bg-error-container/40 text-error hover:bg-error-container'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Deepfake Spoof (88%)
          </button>

          <button
            onClick={() => setScenario('genuine')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              callerId === 'UNK_88291' && !isRecording
                ? 'bg-secondary text-white shadow-sm'
                : 'bg-secondary-container/40 text-secondary hover:bg-secondary-container'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Genuine Human (12%)
          </button>

          <button
            onClick={() => setScenario('borderline')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              callerId === 'EXT_99210' && !isRecording
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Borderline GSM (45%)
          </button>

          <label className="cursor-pointer px-3 py-1.5 rounded-lg font-mono text-xs font-medium bg-surface-container hover:bg-surface-variant text-on-surface transition-all flex items-center gap-1.5 border border-outline-variant/40 shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload WAV</span>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Top Row: Active Interception & Analysis Vectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-stretch">
        
        {/* Active Interception Panel - Increased padding, whitespace, bold prominent risk score */}
        <div className={`lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-md p-6 sm:p-8 lg:p-9 xl:p-10 relative overflow-hidden flex flex-col justify-between gap-7 group border transition-all duration-300 ${
          isThreat ? 'border-error/50 shadow-[0_0_28px_rgba(186,26,26,0.15)]' : 'border-outline-variant/40'
        }`}>
          
          {/* Ambient background glow */}
          {isThreat ? (
            <div className="absolute top-0 right-0 w-80 h-80 bg-error/10 rounded-full blur-[100px] -mr-16 -mt-16 animate-pulse pointer-events-none" />
          ) : (
            <div className="absolute top-0 right-0 w-72 h-72 bg-secondary/5 rounded-full blur-[90px] -mr-16 -mt-16 pointer-events-none" />
          )}

          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
            <div className="flex flex-col gap-1.5">
              <div className={`flex items-center gap-2.5 font-bold ${isThreat ? 'text-error' : 'text-secondary'}`}>
                {isThreat ? (
                  <AlertOctagon className="w-7 h-7 animate-pulse shrink-0" />
                ) : (
                  <ShieldCheck className="w-7 h-7 shrink-0" />
                )}
                <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                  Active Interception
                </h2>
              </div>
              <p className="font-body-md text-sm text-on-surface-variant flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isRecording 
                    ? 'bg-error animate-ping' 
                    : (isThreat 
                        ? 'bg-error animate-status-threat' 
                        : (riskScore >= 35 ? 'bg-amber-500 animate-status-investigating' : 'bg-secondary animate-status-clear')
                      )
                }`} />
                <span>{isRecording ? 'Live Microphone Stream: ' : 'Telephony Session: '}</span>
                <span className="font-mono font-bold text-primary text-base">{callerId}</span>
              </p>
            </div>

            {/* Current Risk Score Display - The largest, boldest element on page */}
            <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-semibold">
                {isAnalyzing && (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                )}
                <span>Current Risk Score</span>
              </span>
              <div className={`flex items-baseline gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-300 ${
                isThreat
                  ? 'bg-error-container/30 border-error/40 shadow-[0_0_24px_rgba(186,26,26,0.18)]'
                  : (riskScore >= 35
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_18px_rgba(245,158,11,0.15)]'
                      : 'bg-secondary-container/20 border-secondary/30 shadow-[0_0_20px_rgba(13,148,136,0.15)]')
              }`}>
                <span className={`font-display-lg text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none transition-all duration-300 ${
                  isThreat 
                    ? 'text-error drop-shadow-[0_0_14px_rgba(239,68,68,0.45)]' 
                    : (riskScore >= 35 ? 'text-amber-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]' : 'text-secondary drop-shadow-[0_0_12px_rgba(13,148,136,0.35)]')
                }`}>
                  <AnimatedCounter value={riskScore} />
                </span>
                <span className="font-mono text-base sm:text-lg font-bold text-on-surface-variant/80">/ 100</span>
              </div>
            </div>
          </div>

          {/* Waveform Visualization Component */}
          <div className="w-full">
            <WaveformVisualizer
              isPlaying={isStreaming && !isTerminated}
              isMicActive={isRecording}
              isAnalyzing={isAnalyzing}
              latencyMs={lastLatencyMs}
              riskScore={riskScore}
              frequencyHz={freqHz}
              amplitudeDb={ampDb}
              liveVolume={liveVolume}
              onTogglePlay={() => setIsStreaming(!isStreaming)}
            />
          </div>

          {/* Recommendation Banner */}
          <div className={`p-4 rounded-xl border text-xs sm:text-sm font-mono flex items-start gap-3 z-10 transition-all ${
            isThreat 
              ? 'bg-error-container/40 border-error/40 text-on-error-container shadow-xs' 
              : (riskScore >= 35 ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs' : 'bg-secondary-container/30 border-secondary/30 text-on-secondary-container shadow-xs')
          }`}>
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider">System Recommendation: </span>
              <span className="leading-relaxed">{recommendation}</span>
            </div>
          </div>

          {/* Bottom Session Details and Terminate Button */}
          <div className="flex flex-wrap justify-between items-center z-10 pt-5 border-t border-outline-variant/30 gap-4">
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase flex items-center gap-1 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-secondary" />
                  Source IP
                </span>
                <span className="font-mono text-sm font-bold text-on-surface mt-0.5">{sourceIP}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  Duration
                </span>
                <span className="font-mono text-sm font-bold text-on-surface mt-0.5">
                  {formatDuration(durationSeconds)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">Action Status</span>
                <span className={`font-mono text-sm font-bold mt-0.5 ${actionTaken === 'Terminated' ? 'text-error' : (actionTaken === 'Flagged' ? 'text-amber-700' : 'text-secondary')}`}>
                  {actionTaken}
                </span>
              </div>
            </div>

            <button
              onClick={handleTerminate}
              disabled={isTerminated}
              className={`font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md ${
                isTerminated
                  ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
                  : 'bg-error text-on-error hover:bg-on-error-container hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <PhoneOff className="w-4 h-4" />
              <span>{isTerminated ? 'Session Terminated' : 'Terminate Connection'}</span>
            </button>
          </div>

        </div>

        {/* Analysis Vectors Column */}
        <div className="lg:col-span-4 flex flex-col">
          <AnalysisVectorsPanel
            vectors={vectors}
            onRefresh={loadLogs}
            isLoading={isLoadingLogs}
          />
        </div>

      </div>

      {/* Bottom Row: Recent Logs & Threat Feed / Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        
        {/* Left 8 Cols: Recent Analysis Table */}
        <div className="lg:col-span-8">
          <RecentLogsTable
            logs={logs}
            onViewAll={() => onNavigate('analytics')}
          />
        </div>

        {/* Right 4 Cols: Threat Feed & Toggles */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ThreatFeed />
          <DetectionSettings
            highSensitivity={highSensitivity}
            onToggleSensitivity={() => setHighSensitivity(!highSensitivity)}
            pushAlerts={pushAlerts}
            onToggleAlerts={() => setPushAlerts(!pushAlerts)}
            riskThreshold={riskThreshold}
            onChangeThreshold={setRiskThreshold}
          />
        </div>

      </div>

    </div>
  );
};
