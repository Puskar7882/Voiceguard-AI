import React, { useEffect, useState } from 'react';
import { Play, Pause, Mic, Zap } from 'lucide-react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  isMicActive?: boolean;
  isAnalyzing?: boolean;
  latencyMs?: number | null;
  riskScore: number;
  frequencyHz?: number;
  amplitudeDb?: number;
  liveVolume?: number; // 0.0 to 1.0 from microphone
  onTogglePlay?: () => void;
  audioSource?: string | null;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  isMicActive = false,
  isAnalyzing = false,
  latencyMs = null,
  riskScore,
  frequencyHz = 440,
  amplitudeDb = 2.4,
  liveVolume = 0.0,
  onTogglePlay,
}) => {
  const [bars, setBars] = useState<number[]>(Array(48).fill(15));
  const isHighRisk = riskScore >= 70;
  const isMediumRisk = riskScore >= 35 && riskScore < 70;

  useEffect(() => {
    let animationFrame: number;
    let tick = 0;

    const updateBars = () => {
      tick += 0.12;
      if (isPlaying || isMicActive) {
        setBars(prev =>
          prev.map((_, i) => {
            if (isMicActive) {
              // Modulate by mic volume, frequency, and analyzing pulse
              const baseBoost = Math.max(14, liveVolume * 160);
              const freqWave = Math.sin(tick * 3 + i * 0.25) * (baseBoost * 0.45);
              const centerMod = 1.0 - (Math.abs(i - 24) / 32);
              const analyzePulse = isAnalyzing ? Math.sin(tick * 4 + i * 0.3) * 12 : 0;
              const height = (baseBoost * centerMod) + freqWave + analyzePulse + (Math.random() * 5);
              
              if (isHighRisk && i > 16 && i < 32) {
                return Math.min(100, Math.max(15, height * 1.3));
              }
              return Math.min(100, Math.max(8, height));
            }

            // Simulated wave patterns
            if (isHighRisk && i > 16 && i < 32) {
              return Math.sin(tick * 2 + i * 0.3) * 35 + 55 + Math.random() * 15;
            }
            if (isMediumRisk && i > 20 && i < 36) {
              return Math.sin(tick * 1.5 + i * 0.2) * 25 + 40 + Math.random() * 10;
            }
            return Math.sin(tick + i * 0.15) * 20 + 28 + Math.random() * 8;
          })
        );
      } else {
        setBars(prev => prev.map((val) => Math.max(8, val * 0.92)));
      }
      animationFrame = requestAnimationFrame(updateBars);
    };

    animationFrame = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, isMicActive, isAnalyzing, isHighRisk, isMediumRisk, liveVolume]);

  // Gradient + Glow styling based on risk level and analyzing state matching Hero waveform
  const getBarColor = (index: number) => {
    if (!isPlaying && !isMicActive) {
      return 'bg-gradient-to-t from-slate-400/20 via-slate-400/30 to-slate-400/50 opacity-60';
    }
    if (isHighRisk && index > 14 && index < 34) {
      return 'bg-gradient-to-t from-[#7f1d1d] via-[#dc2626] to-[#fb7185] shadow-[0_0_12px_rgba(239,68,68,0.65)] drop-shadow-[0_0_4px_rgba(251,113,133,0.7)]';
    }
    if (isMediumRisk && index > 18 && index < 36) {
      return 'bg-gradient-to-t from-[#78350f] via-[#d97706] to-[#fde047] shadow-[0_0_10px_rgba(245,158,11,0.55)] drop-shadow-[0_0_3px_rgba(253,224,71,0.6)]';
    }
    if (isAnalyzing && index % 4 === 0) {
      return 'bg-gradient-to-t from-[#0e7490] via-[#06b6d4] to-[#a5f3fc] shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse';
    }
    return 'bg-gradient-to-t from-[#004d44] via-[#006a61] to-[#2dd4bf] shadow-[0_0_10px_rgba(13,148,136,0.5)] drop-shadow-[0_0_4px_rgba(45,212,191,0.6)]';
  };

  return (
    <div className={`flex-1 bg-surface-container/80 backdrop-blur-sm rounded-xl relative overflow-hidden min-h-[180px] flex flex-col justify-between p-4 md:p-5 z-10 group-hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-all duration-300 border ${
      isMicActive 
        ? (isAnalyzing ? 'border-secondary shadow-[0_0_20px_rgba(13,148,136,0.3)] ring-1 ring-secondary/40' : 'border-secondary/60 shadow-[0_0_14px_rgba(13,148,136,0.18)]') 
        : 'border-outline-variant/40'
    }`}>
      
      {/* Background ambient lighting and subtle waveform grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#006a61_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Header inside Waveform Box */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {isMicActive ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </span>
                <span className="font-mono text-xs uppercase font-bold text-error tracking-wider flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-error animate-pulse" />
                  LIVE MIC STREAM (1.5s WINDOW)
                </span>
              </span>

              {/* Client-Side "Analyzing..." Indicator */}
              {isAnalyzing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-secondary/15 text-secondary border border-secondary/40 animate-pulse shadow-sm">
                  <Zap className="w-3 h-3 text-secondary animate-spin" />
                  <span>ANALYZING CHUNK...</span>
                </span>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? (isHighRisk ? 'bg-error' : 'bg-secondary') : 'bg-outline'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? (isHighRisk ? 'bg-error' : 'bg-secondary') : 'bg-outline'}`}></span>
              </span>
              <span className="font-mono text-xs uppercase text-on-surface-variant font-medium tracking-wide">
                {isPlaying ? (isHighRisk ? 'SYNTHETIC SIGNAL DETECTED' : 'SPECTRAL FLOW ACTIVE') : 'AWAITING AUDIO STREAM'}
              </span>
            </span>
          )}
        </div>

        {onTogglePlay && !isMicActive && (
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm ${
              isPlaying
                ? 'bg-error/10 border-error/30 text-error hover:bg-error/20'
                : 'bg-secondary-container/40 border-secondary/30 text-secondary hover:bg-secondary-container/70'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Stream</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Waveform Bars with glowing teal/brand gradient and smooth height transitions */}
      <div className="relative flex items-center justify-center gap-1 sm:gap-1.5 py-4 h-28 w-full z-10">
        {/* Scanning beam overlay when analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/20 to-transparent animate-pulse pointer-events-none rounded-lg" />
        )}

        {/* Center baseline glow */}
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-secondary/15 pointer-events-none blur-[1px]" />
        
        {bars.map((height, idx) => (
          <div
            key={idx}
            className={`w-1.5 sm:w-2 rounded-full transition-[height,background-image,box-shadow,opacity] duration-150 ease-out transform-gpu ${getBarColor(idx)}`}
            style={{
              height: `${Math.min(100, Math.max(8, height))}%`,
            }}
          />
        ))}
      </div>

      {/* Overlay real-time audio metrics and latency */}
      <div className="flex items-center justify-between z-10 pt-2 border-t border-outline-variant/30 text-[11px] font-mono text-on-surface-variant">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="bg-surface-container-highest/90 backdrop-blur px-2.5 py-0.5 rounded-full text-on-surface font-medium border border-outline-variant/40 shadow-xs">
            Freq: {frequencyHz.toFixed(1)} Hz
          </span>
          <span className="bg-surface-container-highest/90 backdrop-blur px-2.5 py-0.5 rounded-full text-on-surface font-medium border border-outline-variant/40 shadow-xs">
            Amp: {amplitudeDb > 0 ? `+${amplitudeDb.toFixed(1)}` : amplitudeDb.toFixed(1)} dB
          </span>
          {latencyMs !== null && (
            <span className="bg-secondary/10 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
              <Zap className="w-3 h-3 text-secondary" />
              <span>E2E: {latencyMs}ms</span>
            </span>
          )}
        </div>
        <span className="hidden sm:inline text-[10px] text-on-surface-variant font-mono">
          {isMicActive ? 'Continuous 1.5s Sliding Window (500ms Overlap)' : 'PCM 16-bit / 16kHz Rolling Window'}
        </span>
      </div>
    </div>
  );
};
