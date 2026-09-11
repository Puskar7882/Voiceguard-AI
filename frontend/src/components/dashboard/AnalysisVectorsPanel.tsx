import React from 'react';
import { RefreshCw, Zap, Cpu, Link2, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { AnalysisVectors } from '../../types';

interface AnalysisVectorsPanelProps {
  vectors: AnalysisVectors;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AnalysisVectorsPanel: React.FC<AnalysisVectorsPanelProps> = ({
  vectors,
  onRefresh,
  isLoading
}) => {
  const getBadge = (status: 'Clear' | 'Investigating' | 'Threat Detected') => {
    switch (status) {
      case 'Threat Detected':
        return (
          <span className="bg-error-container text-on-error-container font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-error/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-error animate-status-threat" />
            <AlertOctagon className="w-3 h-3 text-error" />
            <span>Threat Detected</span>
          </span>
        );
      case 'Investigating':
        return (
          <span className="bg-amber-100 text-amber-900 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-amber-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-status-investigating" />
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Investigating</span>
          </span>
        );
      case 'Clear':
      default:
        return (
          <span className="bg-secondary-container/60 text-on-secondary-container font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-secondary/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-status-clear" />
            <CheckCircle2 className="w-3 h-3 text-secondary" />
            <span>Clear</span>
          </span>
        );
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (score >= 35) return 'bg-gradient-to-r from-amber-600 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    return 'bg-gradient-to-r from-teal-700 via-secondary to-[#2dd4bf] shadow-[0_0_8px_rgba(13,148,136,0.4)]';
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 p-6 md:p-7 flex flex-col gap-5 h-full transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-secondary" />
          </div>
          <h3 className="font-headline-md text-lg font-bold text-on-surface">Analysis Vectors</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Recalculate Vectors"
            className="text-secondary hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/30"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-brand-spin text-secondary' : ''}`} />
          </button>
        )}
      </div>

      {/* Vector List */}
      <div className="flex flex-col gap-4">
        
        {/* Vector 1: Acoustic Anomaly */}
        <div className="p-3.5 bg-surface-container-low rounded-lg flex flex-col gap-2 hover:shadow-md transition-all duration-200 border border-outline-variant/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs font-semibold text-on-surface">Acoustic Anomaly</span>
            </div>
            {getBadge(vectors.acoustic_anomaly.status)}
          </div>
          
          <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(vectors.acoustic_anomaly.score)}`}
              style={{ width: `${Math.min(100, Math.max(5, vectors.acoustic_anomaly.score))}%` }}
            />
          </div>
          
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            {vectors.acoustic_anomaly.detail}
          </p>
        </div>

        {/* Vector 2: Prosody Score */}
        <div className="p-3.5 bg-surface-container-low rounded-lg flex flex-col gap-2 hover:shadow-md transition-all duration-200 border border-outline-variant/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs font-semibold text-on-surface">Prosody Score</span>
            </div>
            {getBadge(vectors.prosody_score.status)}
          </div>
          
          <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(vectors.prosody_score.score)}`}
              style={{ width: `${Math.min(100, Math.max(5, vectors.prosody_score.score))}%` }}
            />
          </div>
          
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            {vectors.prosody_score.detail}
          </p>
        </div>

        {/* Vector 3: Cross-Session Link */}
        <div className="p-3.5 bg-surface-container-low rounded-lg flex flex-col gap-2 hover:shadow-md transition-all duration-200 border border-outline-variant/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs font-semibold text-on-surface">Cross-Session Link</span>
            </div>
            {getBadge(vectors.cross_session_link.status)}
          </div>
          
          <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(vectors.cross_session_link.score)}`}
              style={{ width: `${Math.min(100, Math.max(5, vectors.cross_session_link.score))}%` }}
            />
          </div>
          
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            {vectors.cross_session_link.detail}
          </p>
        </div>

      </div>
    </div>
  );
};
