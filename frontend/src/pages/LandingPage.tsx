import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  FileAudio, 
  Play, 
  Sparkles,
  Building,
  PhoneCall,
  Server,
  Layers
} from 'lucide-react';
import { analyzeAudio } from '../services/api';
import { AnalysisResult } from '../types';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // Live Analysis Stream simulation matching Stitch Landing Page script
  const [streamCards, setStreamCards] = useState([
    { id: '1', caller: 'Call ID #8921', score: 99.8, status: 'Verified', color: 'text-secondary', bg: 'bg-secondary-container/40', border: 'border-secondary/30' },
    { id: '2', caller: 'Call ID #8922', score: 12.4, status: 'Threat Detected', color: 'text-error', bg: 'bg-error-container/40', border: 'border-error/30' },
    { id: '3', caller: 'Call ID #8923', score: 98.1, status: 'Verified', color: 'text-secondary', bg: 'bg-secondary-container/40', border: 'border-secondary/30' }
  ]);

  const livePool = [
    { caller: 'Call ID #8924', score: 99.5, status: 'Verified', color: 'text-secondary', bg: 'bg-secondary-container/40', border: 'border-secondary/30' },
    { caller: 'Call ID #8925', score: 8.2, status: 'Threat Detected', color: 'text-error', bg: 'bg-error-container/40', border: 'border-error/30' },
    { caller: 'Call ID #8926', score: 97.4, status: 'Verified', color: 'text-secondary', bg: 'bg-secondary-container/40', border: 'border-secondary/30' },
    { caller: 'Call ID #8927', score: 48.0, status: 'Investigating', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' }
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const next = livePool[index % livePool.length];
      setStreamCards(prev => [{ ...next, id: String(Date.now()) }, ...prev.slice(0, 2)]);
      index++;
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Interactive Live Playground State
  const [testResult, setTestResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runSampleTest = async (scenario: 'genuine' | 'deepfake' | 'borderline') => {
    setIsAnalyzing(true);
    try {
      const callerId = scenario === 'deepfake' ? 'INT_CLONE_SAMPLE' : (scenario === 'borderline' ? 'EXT_NOISY_SAMPLE' : 'GENUINE_HUMAN_SAMPLE');
      const res = await analyzeAudio(undefined, callerId, 'fund_transfer');
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col w-full relative overflow-hidden bg-surface text-on-surface pt-16">
      
      {/* Hero Section from Stitch Export 1 */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-12">
        
        {/* Background ambient lighting and wave curves */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[700px] h-[700px] top-[-150px] right-[-100px] rounded-full bg-gradient-to-br from-secondary-container/30 to-transparent blur-[140px]" />
          <div className="absolute w-[500px] h-[500px] bottom-0 left-[-100px] rounded-full bg-gradient-to-tr from-primary/5 to-transparent blur-[100px]" />
        </div>

        <div className="max-w-container-max mx-auto w-full relative z-10 grid grid-cols-12 gap-gutter items-center">
          
          {/* Hero Left Column */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 bg-surface-container-high px-4 py-1.5 rounded-full w-fit border border-outline-variant/50 shadow-sm">
              <Shield className="w-4 h-4 text-secondary" />
              <span className="font-mono text-xs font-semibold text-on-surface uppercase tracking-wider">
                SIH 2026 Problem Statement 26104
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl text-primary font-extrabold tracking-tight leading-[1.1]">
              Stop AI Voice Cloning Fraud <br />
              <span className="text-secondary bg-gradient-to-r from-secondary to-[#0d9488] bg-clip-text text-transparent">
                in Real-Time.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-lg text-on-surface-variant max-w-[620px] leading-relaxed">
              Continuous neural acoustic interception protecting banking transactions, call centers, and executive communications from synthetic deepfakes in milliseconds.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-primary text-on-primary font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg shadow-md hover:bg-inverse-surface hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span>Deploy Interception Hub</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('api-sandbox')}
                className="bg-surface-container-lowest border-[1.5px] border-primary/20 text-primary font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg hover:bg-surface-container transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Explore API Docs & SDK</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant/30 max-w-[560px]">
              <div>
                <div className="font-headline-md text-2xl font-bold text-primary">99.4%</div>
                <div className="font-mono text-[11px] text-on-surface-variant uppercase">EER Detection</div>
              </div>
              <div>
                <div className="font-headline-md text-2xl font-bold text-secondary">&lt; 200ms</div>
                <div className="font-mono text-[11px] text-on-surface-variant uppercase">Interception Latency</div>
              </div>
              <div>
                <div className="font-headline-md text-2xl font-bold text-primary">100%</div>
                <div className="font-mono text-[11px] text-on-surface-variant uppercase">DPDP Compliant</div>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Stitch Live Stream Card */}
          <div className="col-span-12 lg:col-span-5 relative">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-stack-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/50">
                <span className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-secondary" />
                  Live Interception Feed
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-secondary bg-secondary-container/40 px-2.5 py-0.5 rounded-full border border-secondary/30">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  Active
                </span>
              </div>

              {/* Animated Stream Container */}
              <div className="flex flex-col gap-3 min-h-[220px]">
                {streamCards.map((card) => (
                  <div
                    key={card.id}
                    className={`flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border ${card.border} transition-all duration-300 animate-slide-up shadow-sm`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-on-surface">{card.caller}</div>
                      <div className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                        Trust Score: <span className="font-mono font-semibold">{card.score}%</span>
                      </div>
                    </div>
                    <div className={`${card.bg} ${card.color} font-mono text-[11px] font-bold px-3 py-1 rounded-full`}>
                      {card.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Status Footer */}
              <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                <span>Acoustic Neural Engine: AASIST-v4</span>
                <span className="text-secondary font-semibold">Zero Audio Retained</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Live Playground Section */}
      <section className="bg-surface-container-low py-16 px-margin-mobile md:px-margin-desktop border-y border-outline-variant/40">
        <div className="max-w-container-max mx-auto w-full">
          <div className="text-center max-w-[700px] mx-auto mb-10">
            <h2 className="font-headline-lg text-3xl font-bold text-primary">
              Test VoiceGuard Detection Live
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant mt-2">
              Select one of the pre-recorded voice vectors below or upload your own audio file to test immediate acoustic and prosodic verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Option 1: Genuine Sample */}
            <div 
              onClick={() => runSampleTest('genuine')}
              className="bg-surface-container-lowest p-5 rounded-xl border border-secondary/30 hover:border-secondary shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-md">
                    Sample #1
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                </div>
                <h3 className="font-headline-md text-base font-bold text-primary group-hover:text-secondary transition-colors">
                  Organic Human Voice
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Natural human speech with biological pitch vibrato, vocal tract resonance, and dynamic cadence.
                </p>
              </div>
              <button className="mt-4 w-full bg-secondary/10 hover:bg-secondary hover:text-white text-secondary font-mono text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Play className="w-3.5 h-3.5" />
                Test Genuine Audio
              </button>
            </div>

            {/* Option 2: Deepfake Spoof */}
            <div 
              onClick={() => runSampleTest('deepfake')}
              className="bg-surface-container-lowest p-5 rounded-xl border border-error/30 hover:border-error shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-error bg-error-container/40 px-2 py-0.5 rounded-md">
                    Sample #2
                  </span>
                  <AlertTriangle className="w-4 h-4 text-error" />
                </div>
                <h3 className="font-headline-md text-base font-bold text-primary group-hover:text-error transition-colors">
                  Neural AI Clone Spoof
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Synthetic voice clone generated with neural vocoder exhibiting high-frequency phase and prosodic anomalies.
                </p>
              </div>
              <button className="mt-4 w-full bg-error/10 hover:bg-error hover:text-white text-error font-mono text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Play className="w-3.5 h-3.5" />
                Test Deepfake Attack
              </button>
            </div>

            {/* Option 3: Borderline */}
            <div 
              onClick={() => runSampleTest('borderline')}
              className="bg-surface-container-lowest p-5 rounded-xl border border-amber-300 hover:border-amber-500 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    Sample #3
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-headline-md text-base font-bold text-primary group-hover:text-amber-600 transition-colors">
                  Degraded Telephony Call
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Bandwidth-limited GSM audio requiring multi-vector secondary authentication step.
                </p>
              </div>
              <button className="mt-4 w-full bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-mono text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Play className="w-3.5 h-3.5" />
                Test Degraded Stream
              </button>
            </div>

          </div>

          {/* Test Result Display */}
          {testResult && (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-6 shadow-md animate-slide-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-outline-variant/40">
                <div>
                  <span className="font-mono text-xs text-on-surface-variant uppercase">Test Session Verdict</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`font-headline-lg text-2xl font-bold ${testResult.risk_score >= 70 ? 'text-error' : (testResult.risk_score >= 35 ? 'text-amber-600' : 'text-secondary')}`}>
                      {testResult.verdict} ({testResult.risk_score}/100 Risk Score)
                    </span>
                    <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${testResult.risk_score >= 70 ? 'bg-error-container text-on-error-container' : (testResult.risk_score >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-secondary-container text-on-secondary-container')}`}>
                      Action: {testResult.action_taken}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="bg-primary text-on-primary font-mono text-xs uppercase px-4 py-2 rounded-lg hover:bg-inverse-surface transition-all flex items-center gap-1.5"
                >
                  <span>Open Full Interception Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="bg-surface-container p-3 rounded-lg">
                  <div className="font-mono text-on-surface-variant uppercase">Acoustic Anomaly</div>
                  <div className="font-mono font-bold text-sm text-on-surface mt-1">
                    {testResult.vectors.acoustic_anomaly.score}% — {testResult.vectors.acoustic_anomaly.status}
                  </div>
                </div>
                <div className="bg-surface-container p-3 rounded-lg">
                  <div className="font-mono text-on-surface-variant uppercase">Prosody Score</div>
                  <div className="font-mono font-bold text-sm text-on-surface mt-1">
                    {testResult.vectors.prosody_score.score}% — {testResult.vectors.prosody_score.status}
                  </div>
                </div>
                <div className="bg-surface-container p-3 rounded-lg">
                  <div className="font-mono text-on-surface-variant uppercase">Cross-Session Link</div>
                  <div className="font-mono font-bold text-sm text-on-surface mt-1">
                    {testResult.vectors.cross_session_link.score}% — {testResult.vectors.cross_session_link.status}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <div className="text-center max-w-[700px] mx-auto mb-12">
          <h2 className="font-headline-lg text-3xl font-bold text-primary">
            Engineered for High-Stakes Institutional Security
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-2">
            Built specifically to solve SIH Problem Statement 26104 with mathematical rigor, near-zero false-positives across Indian accents, and full DPDP Act compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-headline-md text-lg font-bold text-primary">RawNet2 & AASIST Pipeline</h3>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Analyzes raw waveforms and neural vocoder cutoff boundaries directly without relying on speech-to-text, providing universal dialect robustness across Hindi, English, and regional Indian accents.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Lock className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-headline-md text-lg font-bold text-primary">Privacy & Zero-Persistence</h3>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Adheres strictly to DPDP Act data minimization. Audio buffers are evaluated in ephemeral memory and immediately discarded, persisting only derived cryptographic vectors.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Server className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-headline-md text-lg font-bold text-primary">Drop-In Banking Gateway</h3>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Simple REST `POST /analyze` and WebSocket streaming endpoints ready to integrate into core banking wire-transfer flows, contact centers, and telecom switches.
            </p>
          </div>

        </div>
      </section>

      {/* Footer from Stitch Export 1 */}
      <footer className="w-full bg-surface-container-low py-8 border-t border-outline-variant/40">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant font-body-sm text-xs">
          <div>© 2026 VoiceGuard AI. Securing the sound of trust</div>
          <div className="flex gap-6 font-mono">
            <button onClick={() => onNavigate('api-sandbox')} className="hover:text-primary transition-colors">API Docs</button>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
