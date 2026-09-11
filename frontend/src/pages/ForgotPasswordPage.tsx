import React, { useState } from 'react';
import { Shield, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../services/api';

interface ForgotPasswordPageProps {
  onNavigate: (tab: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-12">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-8 flex flex-col gap-6 animate-slide-up">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-secondary-container shadow-md">
            <Shield className="w-6 h-6 text-[#0D9488]" />
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-primary">
            Forgot Password
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-body-sm text-sm text-on-surface font-semibold mb-1">
                Reset link generated
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed max-w-xs">
                If an account exists with this email, a reset link has been generated. Check the backend console for the link.
              </p>
            </div>
            <button
              onClick={() => onNavigate('auth')}
              className="mt-2 flex items-center gap-2 text-secondary hover:text-primary font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            {errorMsg && (
              <div className="p-3 bg-error-container/40 border border-error/40 rounded-lg text-on-error-container font-mono text-xs">
                {errorMsg}
              </div>
            )}

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
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 bg-primary text-on-primary rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-inverse-surface transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>
            </form>

            <button
              onClick={() => onNavigate('auth')}
              className="flex items-center gap-2 justify-center text-secondary hover:text-primary font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </>
        )}

      </div>
    </div>
  );
};
