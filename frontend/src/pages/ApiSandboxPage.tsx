import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Play, 
  ShieldAlert, 
  Lock, 
  Building2, 
  Send, 
  AlertOctagon, 
  CheckCircle2,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { analyzeAudio } from '../services/api';
import { AnalysisResult } from '../types';
import { BrandLoader } from '../components/common/BrandLoader';

export const ApiSandboxPage: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'js'>('curl');
  const [callerInput, setCallerInput] = useState('INT_EXEC_CHALLENGE');
  const [actionInput, setActionInput] = useState('fund_transfer');
  const [apiResponse, setApiResponse] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bank Mock Interception Simulation state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankStep, setBankStep] = useState<'initiating' | 'intercepting' | 'frozen' | 'approved'>('initiating');
  const [transferAmount, setTransferAmount] = useState('500,000');
  const [bankTargetVoice, setBankTargetVoice] = useState<'deepfake' | 'genuine'>('deepfake');

  const handleTestAPI = async () => {
    setIsLoading(true);
    try {
      const res = await analyzeAudio(undefined, callerInput, actionInput);
      setApiResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const runBankInterceptionDemo = () => {
    setShowBankModal(true);
    setBankStep('initiating');
    setTimeout(() => {
      setBankStep('intercepting');
      setTimeout(() => {
        if (bankTargetVoice === 'deepfake') {
          setBankStep('frozen');
        } else {
          setBankStep('approved');
        }
      }, 2000);
    }, 1200);
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code snippet copied to clipboard!');
  };

  const curlCode = `curl -X POST "http://localhost:8000/api/analyze" \\
  -H "X-API-Key: vg_live_your_api_key_here" \\
  -F "file=@voice_call_chunk.wav" \\
  -F "caller_id=${callerInput}" \\
  -F "action_type=${actionInput}"`;

  const pythonCode = `import requests

url = "http://localhost:8000/api/analyze"
headers = {"X-API-Key": "vg_live_your_api_key_here"}

files = {"file": open("voice_call_chunk.wav", "rb")}
data = {
    "caller_id": "${callerInput}",
    "action_type": "${actionInput}"
}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()

print(f"Risk Score: {result['risk_score']}/100")
print(f"Verdict: {result['verdict']} -> Action: {result['action_taken']}")`;

  const jsCode = `const formData = new FormData();
formData.append('file', audioBlob, 'chunk.wav');
formData.append('caller_id', '${callerInput}');
formData.append('action_type', '${actionInput}');

const response = await fetch('http://localhost:8000/api/analyze', {
  method: 'POST',
  headers: {
    'X-API-Key': 'vg_live_your_api_key_here'
  },
  body: formData
});

const result = await response.json();
console.log(result.verdict, result.risk_score);`;

  return (
    <div className="flex flex-col w-full p-4 md:p-gutter gap-8 max-w-container-max mx-auto">
      
      {/* Header */}
      <div className="border-b border-outline-variant/40 pb-4">
        <h1 className="font-headline-lg text-2xl font-bold text-primary flex items-center gap-2">
          <Code2 className="w-6 h-6 text-secondary" />
          API Documentation & Bank Integration Sandbox
        </h1>
        <p className="font-body-sm text-sm text-on-surface-variant mt-0.5">
          SIH 2026 Problem Statement 26104 integration specification: Embed continuous voice spoof detection into core banking and telephony switches.
        </p>
      </div>

      {/* Featured: Bank Transfer Interception Live Simulator */}
      <div className="bg-surface-container-lowest p-6 rounded-xl border-2 border-primary/20 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-surface-container-lowest to-surface-container-low">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-mono text-[11px] font-bold px-3 py-0.5 rounded-full mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Core Banking Use-Case Demonstration
          </div>
          <h2 className="font-headline-md text-xl font-bold text-primary">
            Live Banking Wire Transfer Interception Simulator
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed max-w-[680px]">
            Experience how VoiceGuard AI acts as a transparent verification firewall during a live ₹500,000 corporate wire transfer request over phone, halting synthetic executive deepfake fraud before funds move.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={bankTargetVoice}
            onChange={(e) => setBankTargetVoice(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-outline-variant/60 bg-white text-xs font-mono focus:outline-none focus:border-secondary"
          >
            <option value="deepfake">Voice: AI Cloned CEO (Spoof)</option>
            <option value="genuine">Voice: Authentic CEO</option>
          </select>

          <button
            onClick={runBankInterceptionDemo}
            className="bg-secondary text-white font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[#0b8277] transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Launch Bank Demo</span>
          </button>
        </div>
      </div>

      {/* Interactive REST API Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        
        {/* Left 6 cols: Request Parameters & Code */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
            <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              API Request Builder: <code className="font-mono text-xs text-secondary">POST /api/analyze</code>
            </h3>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase">Caller ID</label>
                <input
                  type="text"
                  value={callerInput}
                  onChange={(e) => setCallerInput(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase">Action Type</label>
                <select
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                >
                  <option value="fund_transfer">fund_transfer (High Value)</option>
                  <option value="password_reset">password_reset (Credentials)</option>
                  <option value="standard_call">standard_call (General)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleTestAPI}
              disabled={isLoading}
              className="mt-2 w-full bg-primary text-on-primary font-mono text-xs uppercase tracking-wider py-2.5 rounded-lg hover:bg-inverse-surface transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Executing Inference...' : 'Send Live Request'}</span>
            </button>
          </div>

          {/* Code Snippets */}
          <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveLang('curl')}
                  className={`font-mono text-xs px-2.5 py-1 rounded-md transition-colors ${activeLang === 'curl' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveLang('python')}
                  className={`font-mono text-xs px-2.5 py-1 rounded-md transition-colors ${activeLang === 'python' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveLang('js')}
                  className={`font-mono text-xs px-2.5 py-1 rounded-md transition-colors ${activeLang === 'js' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Node.js
                </button>
              </div>

              <button
                onClick={() => copyCode(activeLang === 'curl' ? curlCode : (activeLang === 'python' ? pythonCode : jsCode))}
                className="text-secondary hover:text-primary font-mono text-xs flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>

            <pre className="p-3 bg-surface-container-low rounded-lg font-mono text-[11px] text-on-surface overflow-x-auto border border-outline-variant/30 leading-relaxed">
              {activeLang === 'curl' ? curlCode : (activeLang === 'python' ? pythonCode : jsCode)}
            </pre>
          </div>
        </div>

        {/* Right 6 cols: Live Response JSON Preview */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              Gateway Response Payload
            </h3>
            <span className="font-mono text-xs text-secondary font-bold">200 OK (application/json)</span>
          </div>

          <pre className="flex-1 p-4 bg-surface-container-low rounded-lg font-mono text-[11px] text-on-surface overflow-x-auto border border-outline-variant/30 max-h-[480px]">
            {apiResponse ? JSON.stringify(apiResponse, null, 2) : `// Click 'Send Live Request' above to test the endpoint.
{
  "session_id": "vg_sess_104",
  "caller_id": "${callerInput}",
  "risk_score": 88.0,
  "verdict": "Deepfake",
  "vector_status": "Threat Detected",
  "action_taken": "Terminated",
  "alert_level": "HIGH",
  "recommendation": "CRITICAL: Synthetic voice clone detected.",
  "confidence": 0.965,
  "vectors": {
    "acoustic_anomaly": { "score": 92.4, "status": "Threat Detected" },
    "prosody_score": { "score": 85.0, "status": "Threat Detected" },
    "cross_session_link": { "score": 75.0, "status": "Threat Detected" }
  },
  "privacy_compliance": {
    "raw_audio_discarded": true,
    "dpdp_compliant": true
  }
}`}
          </pre>
        </div>

      </div>

      {/* Mock Bank Interception Modal Simulation */}
      {showBankModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-up">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-outline-variant/50 p-6 flex flex-col gap-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary text-base">HDFC Corporate Banking Portal</span>
              </div>
              <button onClick={() => setShowBankModal(false)} className="text-on-surface-variant hover:text-primary font-mono text-sm">
                ✕
              </button>
            </div>

            {/* Step: Initiating */}
            {bankStep === 'initiating' && (
              <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                <BrandLoader size="lg" label="Processing Wire Authorization..." />
                <p className="text-xs text-on-surface-variant">
                  Transfer Amount: <span className="font-mono font-bold text-primary">₹{transferAmount}</span> to Vendor #4491
                </p>
              </div>
            )}

            {/* Step: Intercepting */}
            {bankStep === 'intercepting' && (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary animate-pulse">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-secondary text-lg">VoiceGuard AI Acoustic Verification Active</h4>
                <p className="text-xs text-on-surface-variant font-mono">
                  Inspecting incoming voice biometrics in real-time...
                </p>
              </div>
            )}

            {/* Step: Frozen (Deepfake Detected) */}
            {bankStep === 'frozen' && (
              <div className="flex flex-col gap-4 animate-slide-up">
                <div className="p-4 bg-error-container/40 border border-error/40 rounded-xl flex items-start gap-3">
                  <AlertOctagon className="w-7 h-7 text-error shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-mono text-sm font-bold text-error uppercase">
                      🚨 Wire Transfer Intercepted & Frozen
                    </h4>
                    <p className="font-body-sm text-xs text-on-error-container mt-1">
                      VoiceGuard AI detected a <span className="font-bold">94% Synthetic AI Voice Clone</span> attempting to authorize a ₹500,000 withdrawal.
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container p-3.5 rounded-lg text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Action Prevented:</span>
                    <span className="font-bold text-error">Unauthorized Wire Debit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Mandatory Protocol:</span>
                    <span className="font-bold text-primary">In-Person Biometric OTP Required</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowBankModal(false)}
                  className="w-full py-2.5 bg-primary text-white rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-inverse-surface transition-colors"
                >
                  Close & Log Security Incident
                </button>
              </div>
            )}

            {/* Step: Approved (Genuine) */}
            {bankStep === 'approved' && (
              <div className="flex flex-col gap-4 animate-slide-up">
                <div className="p-4 bg-secondary-container/40 border border-secondary/40 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-7 h-7 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-mono text-sm font-bold text-secondary uppercase">
                      ✓ Voice Authenticity Confirmed
                    </h4>
                    <p className="font-body-sm text-xs text-on-secondary-container mt-1">
                      Biometric voice acoustic profile matches registered organic voiceprint (99.2% Trust Score). Wire transfer approved.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowBankModal(false)}
                  className="w-full py-2.5 bg-secondary text-white rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-[#0b8277] transition-colors"
                >
                  Complete Transfer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
