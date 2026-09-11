import { User, AnalysisResult, DetectionLogItem, AnalyticsResponse, ApiKeyItem } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('vg_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('vg_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('vg_token');
  localStorage.removeItem('vg_user');
}

export function getStoredUser(): User | null {
  const u = localStorage.getItem('vg_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user: User) {
  localStorage.setItem('vg_user', JSON.stringify(user));
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || errorData.message || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// Authentication
export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: User }> {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

// All public signups default to role "agent" — no role parameter accepted
export async function registerUser(email: string, password: string, plan_id = 'pro'): Promise<{ access_token: string; user: User }> {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, plan_id }),
  });
  setAuthToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch('/auth/me');
}

// -- Forgot / Reset Password --

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

// API Keys
export async function getApiKeys(): Promise<ApiKeyItem[]> {
  return apiFetch('/auth/api-keys');
}

export async function createApiKey(name: string): Promise<ApiKeyItem> {
  return apiFetch('/auth/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(id: number): Promise<{ message: string }> {
  return apiFetch(`/auth/api-keys/${id}`, {
    method: 'DELETE',
  });
}

// Audio Analysis
export async function analyzeAudio(file?: File, caller_id?: string, action_type?: string): Promise<AnalysisResult> {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (caller_id) formData.append('caller_id', caller_id);
  if (action_type) formData.append('action_type', action_type);

  return apiFetch('/analyze', {
    method: 'POST',
    body: formData,
  });
}

export async function analyzeAudioBase64(audioBase64: string, caller_id = 'LIVE_STREAM'): Promise<AnalysisResult> {
  return apiFetch('/analyze/json', {
    method: 'POST',
    body: JSON.stringify({ audio_base64: audioBase64, caller_id }),
  });
}

// Logs and Analytics
export async function fetchLogs(limit = 20, offset = 0, caller_id?: string, verdict?: string): Promise<{ total: number; logs: DetectionLogItem[] }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (caller_id) params.append('caller_id', caller_id);
  if (verdict) params.append('verdict', verdict);
  return apiFetch(`/logs?${params.toString()}`);
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  return apiFetch('/logs/analytics');
}
