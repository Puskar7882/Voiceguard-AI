export interface User {
  id: number;
  email: string;
  role: string;
  plan_id: string;
  created_at?: string;
}

export interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
  full_key?: string;
}

export interface VectorMetric {
  score: number;
  status: 'Clear' | 'Investigating' | 'Threat Detected';
  detail: string;
}

export interface AnalysisVectors {
  acoustic_anomaly: VectorMetric;
  prosody_score: VectorMetric;
  cross_session_link: VectorMetric;
}

export interface AnalysisResult {
  session_id: string;
  caller_id: string;
  risk_score: number;
  verdict: 'Verified' | 'Suspicious' | 'Deepfake';
  vector_status: 'Clear' | 'Investigating' | 'Threat Detected';
  action_taken: 'Allowed' | 'Flagged' | 'Terminated';
  alert_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  confidence?: number;
  architecture?: string;
  vectors: AnalysisVectors;
  features?: {
    spectral: {
      spectral_centroid: number;
      spectral_rolloff: number;
      spectral_flatness: number;
      high_freq_artifacts: number;
      spectral_anomaly_score: number;
    };
    prosody: {
      f0_mean_hz: number;
      f0_std_hz: number;
      jitter_percent: number;
      shimmer_percent: number;
      pause_ratio: number;
      prosody_unnaturalness_score: number;
    };
  };
  timestamp: string;
}

export interface DetectionLogItem {
  id: number;
  timestamp: string;
  time_formatted: string;
  caller_id: string;
  risk_score: number;
  verdict: 'Verified' | 'Suspicious' | 'Deepfake';
  vector_status: 'Clear' | 'Investigating' | 'Threat Detected';
  action_taken: 'Allowed' | 'Flagged' | 'Terminated';
  spectral_anomaly: number;
  prosody_score: number;
  cross_session_link: number;
  features?: any;
}

export interface AnalyticsSummary {
  total_inspections: number;
  threats_intercepted: number;
  suspicious_flagged: number;
  verified_authentic: number;
  false_positive_rate: number;
  detection_accuracy: number;
  avg_latency_ms: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  verdict_distribution: { name: string; value: number; color: string }[];
  timeline: { timestamp: string; risk_score: number; caller_id: string; verdict: string }[];
}
