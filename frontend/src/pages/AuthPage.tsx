import React, { useState } from 'react';

import { Shield, Lock, Mail, ArrowRight, CheckCircle2, User as UserIcon, KeyRound, Mic, Headset, AlertCircle } from 'lucide-react';

import { loginUser, registerUser } from '../services/api';

import { usePermissionStatus } from '../hooks/usePermissionStatus';



interface AuthPageProps {

  onSuccess: (permissionResult: 'granted' | 'denied') => void;

  onNavigate: (tab: string) => void;

}



export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigate }) => {

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user' | null>(null);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);



  const { requestMicPermission } = usePermissionStatus();



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setErrorMsg(null);

    setIsLoading(true);



    try {

      if (isLogin) {

        await loginUser(email, password);

      } else {

        // All public signups default to role "agent" — no role parameter

        await registerUser(email, password, 'pro');

      }



      // Successful authentication: Request microphone permission before transitioning to dashboard

      setIsLoading(false);

      setIsRequestingMic(true);



      // Note: This only re-prompts on logins where the user hasn't already granted/denied

      // permission for this origin — browser-level permission caching determines whether

      // the native prompt appears, which cannot be overridden by application code.

      const permResult = await requestMicPermission();

      

      setIsRequestingMic(false);

      onSuccess(permResult);

    } catch (err: any) {

      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');

      setIsLoading(false);

      setIsRequestingMic(false);

    }

  };



      const autoFillAdmin = () => {
    if (isManuallyEdited) return;
    setEmail('admin@voiceguard.ai');
    setPassword('voiceguard2026');
    setSelectedRole('admin');
    setIsManuallyEdited(false);
  };

  const autoFillUser = () => {
    if (isManuallyEdited) return;
    setEmail('user.verma@fictionalbank-demo.in');
    setPassword('voiceguard2026');
    setSelectedRole('user');
    setIsManuallyEdited(false);
  };



  return (

    <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-12">

      <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-8 flex flex-col gap-6 animate-slide-up relative">

        

        {/* Post-Login Permission Request Overlay */}

        {isRequestingMic && (

          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center gap-4 animate-slide-up">

            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary animate-pulse">

              <Mic className="w-7 h-7" />

            </div>

            <div>

              <h3 className="font-headline-md text-lg font-bold text-primary">

                Requesting Microphone Access

              </h3>

              <p className="font-body-sm text-xs text-on-surface-variant mt-1.5 leading-relaxed">

                Please allow microphone permission in your browser to enable live voice biometric spoofing analysis.

              </p>

            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-secondary bg-secondary-container/30 px-3 py-1 rounded-full border border-secondary/20">

              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />

              <span>Awaiting browser response...</span>

            </div>

          </div>

        )}



        {/* Header */}

        <div className="flex flex-col items-center text-center gap-2">

          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-secondary-container shadow-md">

            <Shield className="w-6 h-6 text-[#0D9488]" />

          </div>

          <h1 className="font-headline-lg text-2xl font-bold text-primary">

            {isLogin ? 'Sign In to VoiceGuard' : 'Create Security Account'}

          </h1>

          <p className="font-body-sm text-xs text-on-surface-variant">

            Continuous real-time voice biometric spoof detection console.

          </p>

        </div>



        {/* Tab switch */}

        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-lg border border-outline-variant/30">

          <button

            type="button"

            onClick={() => { setIsLogin(true); setErrorMsg(null); setSelectedRole(null); setIsManuallyEdited(false); setEmail(''); setPassword(''); }}

            className={`py-1.5 font-mono text-xs uppercase tracking-wider rounded-md transition-all font-semibold ${

              isLogin ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'

            }`}

          >

            Sign In

          </button>

          <button

            type="button"

            onClick={() => { setIsLogin(false); setErrorMsg(null); setSelectedRole(null);  }}

            className={`py-1.5 font-mono text-xs uppercase tracking-wider rounded-md transition-all font-semibold ${

              !isLogin ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'

            }`}

          >

            Register

          </button>

        </div>



        {/* Error Banner */}

        {errorMsg && (

          <div className="p-3 bg-error-container/40 border border-error/40 rounded-lg text-on-error-container font-mono text-xs">

            {errorMsg}

          </div>

        )}



        {/* Form */}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>

            <label className="font-mono text-[11px] text-on-surface-variant uppercase">Email Address</label>

            <div className="relative mt-1">

              <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />

              <input

                type="email"

                required

                placeholder="officer@bank.com"

                value={email}

                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  setSelectedRole(null);
                  if (val === '' && password === '') {
                    setIsManuallyEdited(false);
                  } else {
                    setIsManuallyEdited(true);
                  }
                }}

                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"

              />

            </div>

          </div>



          <div>

            <label className="font-mono text-[11px] text-on-surface-variant uppercase">Password</label>

            <div className="relative mt-1">

              <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />

              <input

                type="password"

                required

                placeholder="••••••••••••"

                value={password}

                onChange={(e) => {
                const val = e.target.value;
                setPassword(val);
                setSelectedRole(null);
                if (email === '' && val === '') {
                  setIsManuallyEdited(false);
                } else {
                  setIsManuallyEdited(true);
                }
              }}

                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"

              />

            </div>

            {/* Forgot password link — only on Sign In */}

            {isLogin && (

              <button

                type="button"

                onClick={() => onNavigate('forgot-password')}

                className="mt-1.5 text-[11px] font-mono text-secondary hover:text-primary transition-colors"

              >

                Forgot password?

              </button>

            )}

          </div>



          {/* Role selector removed — all public signups are "agent" by default.

              Admin accounts must be provisioned via seed script or direct DB operation. */}



          <button

            type="submit"

            disabled={isLoading || isRequestingMic}

            className="mt-2 w-full py-3 bg-primary text-on-primary rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-inverse-surface transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"

          >

            <span>{isLoading ? 'Authenticating...' : (isLogin ? 'Sign In to Dashboard' : 'Create Account')}</span>

            <ArrowRight className="w-4 h-4" />

          </button>

        </form>



        {/* Demo Quick-Fill Buttons */}
        <div className="pt-2 border-t border-outline-variant/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant uppercase">
            <span>One-Click Demo Logins:</span>
            {selectedRole && !isManuallyEdited && (
              <span className="text-secondary lowercase font-semibold">
                selected: {selectedRole}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              id="btn-demo-admin"
              disabled={isManuallyEdited}
              onClick={autoFillAdmin}
              title={isManuallyEdited ? "Clear the form to use demo logins" : "Fill Admin Officer demo credentials"}
              className={`px-3 py-2 rounded-lg border font-mono text-xs text-center transition-all duration-200 flex items-center justify-center gap-2 ${
                isManuallyEdited
                  ? 'bg-surface-container/50 text-on-surface-variant/40 border-outline-variant/20 cursor-not-allowed opacity-60 shadow-none'
                  : selectedRole === 'admin'
                  ? 'bg-secondary text-white border-secondary shadow-md font-semibold ring-2 ring-secondary/25'
                  : 'bg-surface-container hover:bg-surface-container-high text-primary border-outline-variant/40 hover:border-outline-variant cursor-pointer'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 transition-colors duration-200 shrink-0 ${
                isManuallyEdited
                  ? 'text-on-surface-variant/40'
                  : selectedRole === 'admin'
                  ? 'text-white'
                  : 'text-secondary'
              }`} />
              <span>Admin Officer</span>
            </button>
            <button
              type="button"
              id="btn-demo-user"
              disabled={isManuallyEdited}
              onClick={autoFillUser}
              title={isManuallyEdited ? "Clear the form to use demo logins" : "Fill User demo credentials"}
              className={`px-3 py-2 rounded-lg border font-mono text-xs text-center transition-all duration-200 flex items-center justify-center gap-2 ${
                isManuallyEdited
                  ? 'bg-surface-container/50 text-on-surface-variant/40 border-outline-variant/20 cursor-not-allowed opacity-60 shadow-none'
                  : selectedRole === 'user'
                  ? 'bg-secondary text-white border-secondary shadow-md font-semibold ring-2 ring-secondary/25'
                  : 'bg-surface-container hover:bg-surface-container-high text-primary border-outline-variant/40 hover:border-outline-variant cursor-pointer'
              }`}
            >
              <Headset className={`w-3.5 h-3.5 transition-colors duration-200 shrink-0 ${
                isManuallyEdited
                  ? 'text-on-surface-variant/40'
                  : selectedRole === 'user'
                  ? 'text-white'
                  : 'text-secondary'
              }`} />
              <span>User</span>
            </button>
          </div>

          {isManuallyEdited && (
            <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant/70 animate-slide-up">
              <span>Clear the form to use demo logins</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setIsManuallyEdited(false);
                  setSelectedRole(null);
                }}
                className="text-secondary hover:underline font-semibold"
              >
                Clear form
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};