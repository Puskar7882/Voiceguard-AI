import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Download } from 'lucide-react';
import { DetectionLogItem } from '../../types';

interface RecentLogsTableProps {
  logs: DetectionLogItem[];
  onViewAll?: () => void;
  onSelectLog?: (log: DetectionLogItem) => void;
}

export const RecentLogsTable: React.FC<RecentLogsTableProps> = ({
  logs,
  onViewAll,
  onSelectLog
}) => {
  const getRiskScoreBadge = (score: number) => {
    if (score >= 70) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-error-container text-on-error-container font-mono text-xs font-bold border border-error/30 shadow-[0_0_8px_rgba(186,26,26,0.2)]">
          {Math.round(score)}
        </span>
      );
    }
    if (score >= 35) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-bold border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
          {Math.round(score)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-container/60 text-on-secondary-container font-mono text-xs font-bold border border-secondary/30 shadow-[0_0_8px_rgba(13,148,136,0.2)]">
        {Math.round(score).toString().padStart(2, '0')}
      </span>
    );
  };

  const getVectorStatusBadge = (status: string, verdict: string) => {
    if (verdict === 'Deepfake' || status === 'Threat Detected') {
      return (
        <span className="flex items-center gap-1.5 text-error font-mono text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-error animate-status-threat" />
          <AlertCircle className="w-3.5 h-3.5 text-error" />
          <span>Deepfake</span>
        </span>
      );
    }
    if (verdict === 'Suspicious' || status === 'Investigating') {
      return (
        <span className="flex items-center gap-1.5 text-amber-600 font-mono text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-status-investigating" />
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Suspicious</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-secondary font-mono text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-secondary animate-status-clear" />
        <CheckCircle className="w-3.5 h-3.5 text-secondary" />
        <span>Verified</span>
      </span>
    );
  };

  const getActionClass = (action: string) => {
    if (action === 'Terminated') {
      return 'font-mono text-xs font-bold text-error';
    }
    if (action === 'Flagged') {
      return 'font-mono text-xs font-medium text-amber-700';
    }
    return 'font-mono text-xs text-on-surface-variant';
  };

  const exportCSV = () => {
    const headers = ["Timestamp", "Caller ID", "Risk Score", "Verdict", "Action Taken", "Acoustic Anomaly", "Prosody Score"];
    const rows = logs.map(l => [
      l.time_formatted || l.timestamp,
      l.caller_id,
      l.risk_score,
      l.verdict,
      l.action_taken,
      l.spectral_anomaly,
      l.prosody_score
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VoiceGuard_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 p-6 md:p-7 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-headline-md text-lg font-bold text-on-surface">Recent Analysis Logs</h3>
          <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant/30">
            {logs.length} Recorded
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="text-xs font-mono text-on-surface-variant hover:text-primary flex items-center gap-1.5 border border-outline-variant/40 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Export
          </button>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-secondary font-mono text-xs font-semibold hover:underline"
            >
              View Full History →
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Caller ID</th>
              <th className="py-3 px-3 text-center">Risk Score</th>
              <th className="py-3 px-3">Vector Status</th>
              <th className="py-3 px-3 text-right">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-on-surface-variant font-mono text-xs">
                  No detection logs found. Start an audio stream or trigger a demo test.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog && onSelectLog(log)}
                  className="animate-row-enter hover:bg-surface-container-low/80 transition-all duration-200 cursor-pointer group"
                >
                  <td className="py-3.5 px-3 text-on-surface-variant font-mono text-xs">
                    {log.time_formatted || new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs font-semibold text-primary group-hover:text-secondary transition-colors">
                    {log.caller_id}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    {getRiskScoreBadge(log.risk_score)}
                  </td>
                  <td className="py-3.5 px-3">
                    {getVectorStatusBadge(log.vector_status, log.verdict)}
                  </td>
                  <td className={`py-3.5 px-3 text-right ${getActionClass(log.action_taken)}`}>
                    {log.action_taken}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
