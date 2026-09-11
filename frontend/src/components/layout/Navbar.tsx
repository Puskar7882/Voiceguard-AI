import React from 'react';
import { Shield, ArrowRight, User as UserIcon, Lock, Activity } from 'lucide-react';
import { getStoredUser, clearAuthToken } from '../../services/api';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const user = getStoredUser();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-all">
      <div className="h-16 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-secondary-container shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-[#0D9488]" />
          </div>
          <span className="font-headline-md text-xl font-bold text-primary tracking-tight">
            VoiceGuard <span className="text-secondary font-mono text-base font-semibold">AI</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          <button 
            onClick={() => onNavigate('home')} 
            className={`font-body-md text-sm font-medium transition-colors ${currentTab === 'home' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Overview
          </button>
          {user && (
            <>
              <button 
                onClick={() => onNavigate('dashboard')} 
                className={`font-body-md text-sm font-medium transition-colors flex items-center gap-1.5 ${currentTab === 'dashboard' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <Activity className="w-4 h-4 text-secondary" />
                Live Interception
              </button>
              <button 
                onClick={() => onNavigate('analytics')} 
                className={`font-body-md text-sm font-medium transition-colors ${currentTab === 'analytics' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Analytics & History
              </button>
              <button 
                onClick={() => onNavigate('settings')} 
                className={`font-body-md text-sm font-medium transition-colors ${currentTab === 'settings' || currentTab === 'pricing' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Settings & Billing
              </button>
              <button 
                onClick={() => onNavigate('api-sandbox')} 
                className={`font-body-md text-sm font-medium transition-colors ${currentTab === 'api-sandbox' ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                API & Telephony SDK
              </button>
            </>
          )}
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-inverse-surface transition-all shadow-sm flex items-center gap-2"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div 
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-2 pl-2 border-l border-outline-variant/60 cursor-pointer"
                title={`Logged in as ${user.email}`}
              >
                <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary font-semibold text-xs border border-secondary/30">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('auth')}
                className="text-on-surface-variant hover:text-primary font-mono text-xs uppercase tracking-wider px-3 py-2 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-secondary text-white px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-[#0b8277] transition-all shadow-sm flex items-center gap-2"
              >
                <span>Launch Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
