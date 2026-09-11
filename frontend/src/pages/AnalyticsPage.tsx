import React, { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  Search, 
  Download, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  Cpu,
  CheckCircle2,
  ListFilter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { fetchAnalytics, fetchLogs } from '../services/api';
import { AnalyticsResponse, DetectionLogItem } from '../types';

interface AnalyticsPageProps {
  initialTab?: 'overview' | 'logs';
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>(initialTab);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [logs, setLogs] = useState<DetectionLogItem[]>([]);
  const [searchCaller, setSearchCaller] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, logsData] = await Promise.all([
        fetchAnalytics(),
        fetchLogs(100, 0, searchCaller || undefined, verdictFilter || undefined)
      ]);
      setAnalytics(analyticsData);
      setLogs(logsData.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [verdictFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  // Filter logs by date range on client-side
  const filteredLogs = logs.filter(log => {
    if (dateRangeFilter === 'all') return true;
    const logDate = new Date(log.timestamp).getTime();
    const now = Date.now();
    if (dateRangeFilter === 'today') {
      return now - logDate <= 24 * 60 * 60 * 1000;
    }
    if (dateRangeFilter === '7d') {
      return now - logDate <= 7 * 24 * 60 * 60 * 1000;
    }
    if (dateRangeFilter === '30d') {
      return now - logDate <= 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    const headers = [
      "Log ID", 
      "Timestamp", 
      "Caller ID", 
      "Risk Score", 
      "Verdict", 
      "Vector Status", 
      "Action Taken", 
      "Acoustic Anomaly (%)", 
      "Prosody Score (%)"
    ];
    const rows = logs.map(l => [
      `VG-${l.id.toString().padStart(4, '0')}`,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.caller_id}"`,
      Math.round(l.risk_score),
      `"${l.verdict}"`,
      `"${l.vector_status}"`,
      `"${l.action_taken}"`,
      l.spectral_anomaly,
      l.prosody_score
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VoiceGuard_Full_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full p-4 md:p-gutter gap-6 max-w-container-max mx-auto">
      
      {/* Top Header & Tab Toggle Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-secondary" />
            Analytics & Audit Intelligence
          </h1>
          <p className="font-body-sm text-sm text-on-surface-variant mt-0.5">
            Institutional telemetry, false-positive metrics, and continuous session audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Top Tabs Switcher */}
          <div className="bg-surface-container p-1 rounded-xl border border-outline-variant/40 flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-secondary" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-secondary" />
              <span>Detailed Logs ({logs.length})</span>
            </button>
          </div>

          {/* Export CSV Button (Accessible from both tabs) */}
          <button
            onClick={exportCSV}
            className="bg-primary text-on-primary font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-inverse-surface transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
            title="Export full dataset to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export Full Audit CSV</span>
            <span className="md:hidden">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: OVERVIEW ===================== */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-slide-up">
          
          {/* Summary KPI Cards */}
          {analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                <span className="font-mono text-xs text-on-surface-variant uppercase">Total Inspections</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-lg text-3xl font-extrabold text-primary">
                    {analytics.summary.total_inspections.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-secondary font-semibold">+12% today</span>
                </div>
                <span className="text-[11px] text-on-surface-variant mt-2">Continuous stream chunks</span>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                <span className="font-mono text-xs text-on-surface-variant uppercase">Threats Intercepted</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-lg text-3xl font-extrabold text-error">
                    {analytics.summary.threats_intercepted}
                  </span>
                  <span className="font-mono text-xs text-error font-semibold">100% Terminated</span>
                </div>
                <span className="text-[11px] text-on-surface-variant mt-2">Prevented spoof attacks</span>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                <span className="font-mono text-xs text-on-surface-variant uppercase">False-Positive Rate</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-lg text-3xl font-extrabold text-secondary">
                    {analytics.summary.false_positive_rate}%
                  </span>
                  <span className="font-mono text-xs text-secondary font-semibold">ASVspoof benchmark</span>
                </div>
                <span className="text-[11px] text-on-surface-variant mt-2">Calibrated for Indian accents</span>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                <span className="font-mono text-xs text-on-surface-variant uppercase">Avg Detection Latency</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-headline-lg text-3xl font-extrabold text-primary">
                    {analytics.summary.avg_latency_ms} ms
                  </span>
                  <span className="font-mono text-xs text-secondary font-semibold">&lt; 300ms SLA</span>
                </div>
                <span className="text-[11px] text-on-surface-variant mt-2">End-to-end WebSocket loop</span>
              </div>

            </div>
          )}

          {/* Visual Charts Row */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              
              {/* Risk Score Time Series Trend */}
              <div className="lg:col-span-8 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                  <div>
                    <h3 className="font-headline-md text-base font-bold text-on-surface">
                      Risk Score Trajectory Over Time
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Telemetry tracking anomaly scores across live telephony sessions
                    </p>
                  </div>
                  <span className="font-mono text-xs text-secondary font-semibold bg-secondary-container/30 px-2.5 py-1 rounded-md border border-secondary/20">
                    Past 12 Hours
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.timeline}>
                      <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#BA1A1A" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
                      <XAxis dataKey="timestamp" stroke="#76777d" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <YAxis domain={[0, 100]} stroke="#76777d" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #c6c6cd', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="risk_score"
                        stroke="#0F172A"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#riskGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Verdict Distribution Pie Chart */}
              <div className="lg:col-span-4 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
                <div className="border-b border-outline-variant/30 pb-2">
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    Verdict Distribution
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Classification proportions across all audited voice chunks
                  </p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.verdict_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.verdict_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #c6c6cd', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* Quick Recent Activity Preview with button to switch to Detailed Logs */}
          <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Recent Interceptions Snapshot
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Latest intercepted telephony connections
                </p>
              </div>
              <button
                onClick={() => setActiveTab('logs')}
                className="text-secondary hover:text-primary font-mono text-xs font-bold hover:underline flex items-center gap-1"
              >
                <span>View Full Audit Table & Filters</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant uppercase text-[11px]">
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Caller ID</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3">Verdict</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {logs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-2.5 px-3 text-on-surface-variant">#VG-{log.id.toString().padStart(4, '0')}</td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-primary">{log.caller_id}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          log.risk_score >= 70 ? 'bg-error-container text-on-error-container' : (log.risk_score >= 35 ? 'bg-amber-100 text-amber-900' : 'bg-secondary-container text-on-secondary-container')
                        }`}>
                          {Math.round(log.risk_score)}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-semibold ${log.verdict === 'Deepfake' ? 'text-error' : (log.verdict === 'Suspicious' ? 'text-amber-600' : 'text-secondary')}`}>
                        {log.verdict}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${log.action_taken === 'Terminated' ? 'text-error' : (log.action_taken === 'Flagged' ? 'text-amber-700' : 'text-secondary')}`}>
                        {log.action_taken}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================== TAB 2: DETAILED LOGS ===================== */}
      {activeTab === 'logs' && (
        <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-6 animate-slide-up">
          
          {/* Header & Comprehensive Filter Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-outline-variant/30 pb-4">
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-secondary" />
                Comprehensive Session Audit Trail ({filteredLogs.length} Records)
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                DPDP Act 2023 compliant telemetry. Persists derived biometrics and verdicts with zero raw audio storage.
              </p>
            </div>

            {/* Filter Controls: Search, Verdict Type, Date Range */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              
              {/* Caller ID Search */}
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter Caller ID..."
                  value={searchCaller}
                  onChange={(e) => setSearchCaller(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <select
                  value={dateRangeFilter}
                  onChange={(e) => {
                    setDateRangeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="py-1.5 px-3 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today (Past 24h)</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                </select>
              </div>

              {/* Verdict Type Filter */}
              <div className="relative">
                <select
                  value={verdictFilter}
                  onChange={(e) => {
                    setVerdictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="py-1.5 px-3 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary font-medium"
                >
                  <option value="">All Verdicts</option>
                  <option value="Verified">Verified Only</option>
                  <option value="Suspicious">Suspicious Only</option>
                  <option value="Deepfake">Deepfake Only</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-3 py-1.5 bg-secondary text-white rounded-lg font-mono text-xs font-bold hover:bg-[#0b8277] transition-colors"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Full Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider bg-surface-container-low/50">
                  <th className="py-3 px-3">Session ID</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Caller ID</th>
                  <th className="py-3 px-3 text-center">Risk Score</th>
                  <th className="py-3 px-3">Verdict</th>
                  <th className="py-3 px-3">Vector Status</th>
                  <th className="py-3 px-3 text-center">Spectral Anomaly</th>
                  <th className="py-3 px-3 text-center">Prosody Anomaly</th>
                  <th className="py-3 px-3 text-right">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-sm">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">
                        #VG-{log.id.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold text-primary">
                        {log.caller_id}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold ${
                          log.risk_score >= 70 ? 'bg-error-container text-on-error-container' : (log.risk_score >= 35 ? 'bg-amber-100 text-amber-900' : 'bg-secondary-container text-on-secondary-container')
                        }`}>
                          {Math.round(log.risk_score)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-mono text-xs font-bold flex items-center gap-1.5 ${
                          log.verdict === 'Deepfake' ? 'text-error' : (log.verdict === 'Suspicious' ? 'text-amber-600' : 'text-secondary')
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.verdict === 'Deepfake' ? 'bg-error' : (log.verdict === 'Suspicious' ? 'bg-amber-500' : 'bg-secondary')
                          }`} />
                          {log.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">
                        {log.vector_status || (log.risk_score >= 70 ? 'Threat Detected' : (log.risk_score >= 35 ? 'Investigating' : 'Clear'))}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-on-surface-variant">
                        {log.spectral_anomaly}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-on-surface-variant">
                        {log.prosody_score}%
                      </td>
                      <td className={`py-3 px-3 text-right font-mono text-xs font-bold ${
                        log.action_taken === 'Terminated' ? 'text-error' : (log.action_taken === 'Flagged' ? 'text-amber-700' : 'text-secondary')
                      }`}>
                        {log.action_taken}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-on-surface-variant font-mono text-xs">
                      No session audit records matched the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-outline-variant/30 text-xs font-mono text-on-surface-variant">
            <span>
              Showing {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1 bg-surface-container rounded-lg font-bold text-on-surface">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
