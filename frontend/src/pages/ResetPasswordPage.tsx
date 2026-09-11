import React, { useState } from 'react';
import { Shield, Lock, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { resetPassword } from '../services/api';

interface ResetPasswordPageProps {
  onNavigate: (tab: string) => void;
  token: string | null;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate, token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!token) {
      setErrorMsg('Missing reset token. Please use the link from the reset email.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The token may have expired.');
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
            Reset Password
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Enter a new password for your account.
          </p>
        </div>

        {!token ? (
          /* No token */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-error-container/40 flex items-center justify-center text-error">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-body-sm text-sm text-on-surface font-semibold mb-1">
                Invalid Reset Link
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed max-w-xs">
                This link is missing a valid reset token. Please request a new password reset.
              </p>
            </div>
            <button
              onClick={() => onNavigate('forgot-password')}
              className="mt-2 flex items-center gap-2 text-secondary hover:text-primary font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Request New Reset
            </button>
          </div>
        ) : success ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-body-sm text-sm text-on-surface font-semibold mb-1">
                Password Updated
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed max-w-xs">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
            </div>
            <button
              onClick={() => onNavigate('auth')}
              className="mt-2 flex items-center gap-2 text-secondary hover:text-primary font-mono text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Sign In
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
                <label className="font-mono text-[11px] text-on-surface-variant uppercase">New Password</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase">Confirm Password</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 bg-primary text-on-primary rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-inverse-surface transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
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
