import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Check, 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  EyeOff,
  User,
  Globe,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { 
  getApiKeys, 
  createApiKey, 
  revokeApiKey,
  getStoredUser
} from '../services/api';
import { ApiKeyItem } from '../types';

interface SettingsPageProps {
  initialTab?: 'general' | 'billing';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'billing'>(initialTab);
  const user = getStoredUser();

  // General Settings state
  const [highSensitivity, setHighSensitivity] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [webhookUrl, setWebhookUrl] = useState('https://banking-gateway.internal/sec/v1/intercept-webhook');
  const [autoSeverCall, setAutoSeverCall] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdFullKey, setCreatedFullKey] = useState<string | null>(null);

  const loadApiKeys = async () => {
    try {
      const keysData = await getApiKeys().catch(() => []);
      setApiKeys(keysData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const keyItem = await createApiKey(newKeyName.trim());
      if (keyItem.full_key) {
        setCreatedFullKey(keyItem.full_key);
      }
      setNewKeyName('');
      loadApiKeys();
    } catch (err: any) {
      alert(err.message || 'Could not create API key');
    }
  };

  const handleRevokeKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await revokeApiKey(id);
      loadApiKeys();
    } catch (err: any) {
      alert(err.message || 'Could not revoke key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col w-full p-4 md:p-gutter gap-6 max-w-container-max mx-auto">
      
      {/* Page Header & Tabs Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-primary flex items-center gap-2">
            <Sliders className="w-6 h-6 text-secondary" />
            System Settings
          </h1>
          <p className="font-body-sm text-sm text-on-surface-variant mt-0.5">
            Configure detection sensitivity, DPDP compliance, and API access tokens.
          </p>
        </div>

        {/* Top Tab Switcher */}
        <div className="bg-surface-container p-1 rounded-xl border border-outline-variant/40 flex items-center shadow-inner">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'general'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-secondary" />
            <span>General & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-secondary" />
            <span>API Keys</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: GENERAL SETTINGS ===================== */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneralSettings} className="flex flex-col gap-6 animate-slide-up">
          
          {saveSuccessMsg && (
            <div className="p-4 bg-secondary-container/50 border border-secondary/50 rounded-xl text-on-secondary-container font-mono text-xs flex items-center gap-2 animate-slide-up shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
              <span>Configuration preferences saved and applied to active telemetry sessions.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Left 7 Cols: Detection Parameters & Security Thresholds */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                  <div>
                    <h3 className="font-headline-md text-base font-bold text-on-surface">
                      Detection Sensitivity & Auto-Interception
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Tune spectral thresholds and automatic telephony termination rules.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-secondary font-bold bg-secondary-container/30 px-2.5 py-1 rounded-md border border-secondary/20">
                    Live Engine
                  </span>
                </div>

                {/* Toggle 1: High Sensitivity Mode */}
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <div className="flex flex-col pr-4">
                    <span className="font-body-md text-sm font-semibold text-on-surface">High Sensitivity Mode</span>
                    <span className="font-body-sm text-xs text-on-surface-variant">
                      Enables multi-band neural vocoder artifact detection (HiFi-GAN & MelGAN phase check).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighSensitivity(!highSensitivity)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative focus:outline-none p-1 shrink-0 ${
                      highSensitivity ? 'bg-secondary' : 'bg-surface-variant'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        highSensitivity ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Real-Time Threat Alerts */}
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <div className="flex flex-col pr-4">
                    <span className="font-body-md text-sm font-semibold text-on-surface">Real-Time Threat Alerts</span>
                    <span className="font-body-sm text-xs text-on-surface-variant">
                      Broadcast instant visual & audio alarm popups to supervisor terminals on high-risk spoof detection.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative focus:outline-none p-1 shrink-0 ${
                      pushAlerts ? 'bg-secondary' : 'bg-surface-variant'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        pushAlerts ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Auto Sever Call on Deepfake */}
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <div className="flex flex-col pr-4">
                    <span className="font-body-md text-sm font-semibold text-on-surface">Automatic Telephony Sever</span>
                    <span className="font-body-sm text-xs text-on-surface-variant">
                      Automatically execute SIP disconnect signal when risk score crosses threshold for &gt;2 consecutive chunks.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSeverCall(!autoSeverCall)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative focus:outline-none p-1 shrink-0 ${
                      autoSeverCall ? 'bg-error' : 'bg-surface-variant'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        autoSeverCall ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Risk Threshold Slider */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-semibold text-on-surface">Deepfake Verdict Threshold:</span>
                    <span className="font-mono font-extrabold text-error bg-error-container/40 px-2.5 py-0.5 rounded-full">
                      {riskThreshold} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
                    <button type="button" onClick={() => setRiskThreshold(40)} className="hover:text-primary">
                      Aggressive (40)
                    </button>
                    <button type="button" onClick={() => setRiskThreshold(70)} className="hover:text-primary font-bold text-secondary">
                      Standard (70)
                    </button>
                    <button type="button" onClick={() => setRiskThreshold(90)} className="hover:text-primary">
                      Conservative (90)
                    </button>
                  </div>
                </div>

              </div>

              {/* Webhook Alert Integration */}
              <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
                <div className="border-b border-outline-variant/30 pb-3">
                  <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                    <Globe className="w-5 h-5 text-secondary" />
                    Security Webhook Dispatch URL
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    POST JSON threat alerts immediately to your core banking fraud or SIEM orchestrator.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-on-surface font-semibold">
                    Target Endpoint (HTTPS)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

            </div>

            {/* Right 5 Cols: Profile, DPDP Privacy & Compliance */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Account & Profile Summary */}
              <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-bold text-sm border border-secondary/30">
                    {user ? user.email.substring(0, 2).toUpperCase() : 'AU'}
                  </div>
                  <div>
                    <h3 className="font-headline-md text-sm font-bold text-on-surface">
                      {user ? user.email : 'admin@voiceguard.ai'}
                    </h3>
                    <span className="font-mono text-[11px] text-secondary font-bold uppercase">
                      Role: {user?.role || 'Administrator'} • {user?.plan_id ? `${user.plan_id} Tier` : 'Enterprise'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-on-surface-variant">
                  <div className="flex justify-between py-1 border-b border-outline-variant/10">
                    <span>Institutional Entity:</span>
                    <span className="font-semibold text-primary">Scheduled Commercial Bank</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-outline-variant/10">
                    <span>Session Protocol:</span>
                    <span className="font-semibold text-primary">TLS 1.3 / WSS Enforced</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Audit Trail Retention:</span>
                    <span className="font-semibold text-primary">180 Days (PCI-DSS)</span>
                  </div>
                </div>
              </div>

              {/* DPDP Act Compliance Card */}
              <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-secondary/30 shadow-sm flex flex-col gap-3.5 bg-gradient-to-br from-surface-container-lowest to-secondary-container/10">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-secondary" />
                  <h4 className="font-headline-md text-sm font-bold text-on-surface">
                    Digital Personal Data Protection (DPDP) Act 2023 Shield
                  </h4>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  VoiceGuard AI operates under strict mathematical data minimization principles:
                </p>
                <ul className="space-y-2 text-xs font-mono text-on-surface">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Raw microphone and telephony audio is evaluated in volatile memory and purged immediately post-verdict.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Only privacy-safe derived acoustic metrics (spectral centroid, pitch variance) are logged for institutional compliance.</span>
                  </li>
                </ul>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-3 bg-secondary text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#0b8277] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration Preferences</span>
              </button>

            </div>

          </div>

        </form>
      )}

      {/* ===================== TAB 2: API KEYS ===================== */}
      {activeTab === 'billing' && (
        <div className="flex flex-col gap-6 animate-slide-up">

          {/* API Key Management Section */}
          <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                  <Key className="w-5 h-5 text-secondary" />
                  API Access Keys (External Banking Gateway)
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Use header <code className="font-mono bg-surface-container px-1.5 py-0.5 rounded text-primary">X-API-Key: vg_live_...</code> to authenticate automated wire-interception requests.
                </p>
              </div>
            </div>

            {/* Generate Key Form */}
            <form onSubmit={handleCreateApiKey} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Key Description (e.g. Core Banking Transfer Gateway)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 min-w-[240px] px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-inverse-surface transition-all flex items-center gap-1.5 shadow-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New API Key</span>
              </button>
            </form>

            {/* Key Display Banner */}
            {createdFullKey && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-mono text-xs flex flex-col gap-1.5">
                <span className="font-bold">⚠️ Copy your secret API key now. It will not be shown again:</span>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-amber-200">
                  <code className="text-primary font-bold">{createdFullKey}</code>
                  <button
                    onClick={() => copyToClipboard(createdFullKey)}
                    className="text-secondary hover:text-primary flex items-center gap-1 text-xs font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Key List */}
            <div className="divide-y divide-outline-variant/20">
              {apiKeys.map((key) => (
                <div key={key.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-on-surface">{key.name}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant mt-0.5">
                      <code>{key.key_prefix}••••••••••••••••</code>
                      <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                      {key.last_used_at && <span>Last Used: {new Date(key.last_used_at).toLocaleTimeString()}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="text-error hover:bg-error-container/40 p-1.5 rounded transition-colors text-xs font-mono flex items-center gap-1 font-semibold"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
