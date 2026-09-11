import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ApiSandboxPage } from './pages/ApiSandboxPage';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Bell, Search, ExternalLink, ShieldAlert, CheckCircle2, MicOff, X, RotateCw } from 'lucide-react';
import { getStoredUser } from './services/api';
import { usePermissionStatus } from './hooks/usePermissionStatus';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [notificationCount, setNotificationCount] = useState(2);
  const user = getStoredUser();

  const {
    micStatus,
    setMicStatus,
    isBannerDismissed,
    setIsBannerDismissed,
    requestMicPermission
  } = usePermissionStatus();

  // Role-based route protection: Redirect "user" away from admin-only routes
  useEffect(() => {
    if (user && user.role === 'user' && ['settings', 'api-sandbox'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [currentTab, user]);

  // Consolidated dashboard view routes
  const isDashboardView = ['dashboard', 'analytics', 'logs', 'api-sandbox', 'settings'].includes(currentTab);

  const handleAuthSuccess = (permResult: 'granted' | 'denied') => {
    setMicStatus(permResult);
    if (permResult === 'denied') {
      setIsBannerDismissed(false);
    }
    setCurrentTab('dashboard');
  };

  const getHeaderTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Interception Center';
      case 'analytics':
      case 'logs':
        return 'Analytics & Audit Intelligence';
      case 'api-sandbox':
        return 'API & Bank Sandbox';
      case 'settings':
        return 'System Settings';
      default:
        return tab.replace('-', ' ');
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col selection:bg-secondary/20 selection:text-secondary">
      
      {/* If Landing Page or Auth: Render top Navbar */}
      {!isDashboardView ? (
        <>
          <Navbar currentTab={currentTab} onNavigate={setCurrentTab} />
          <main className="flex-1 w-full">
            {currentTab === 'home' && <LandingPage onNavigate={setCurrentTab} />}
            {currentTab === 'auth' && <AuthPage onSuccess={handleAuthSuccess} onNavigate={setCurrentTab} />}
            {currentTab === 'forgot-password' && <ForgotPasswordPage onNavigate={setCurrentTab} />}
            {currentTab === 'reset-password' && (
              <ResetPasswordPage 
                onNavigate={setCurrentTab} 
                token={new URLSearchParams(window.location.search).get('token')} 
              />
            )}
          </main>
        </>
      ) : (
        /* If Dashboard View: Render Sidebar + Dashboard Top Header + Content */
        <div className="flex min-h-screen w-full">
          
          {/* Desktop Fixed Sidebar */}
          <Sidebar currentTab={currentTab} onNavigate={setCurrentTab} />

          {/* Main Dashboard Workspace Content */}
          <div className="flex-1 lg:pl-64 flex flex-col min-w-0 bg-surface">
            
            {/* Persistent Dismissible Permission Denied Banner */}
            {micStatus === 'denied' && !isBannerDismissed && (
              <div className="bg-amber-500 text-slate-900 px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-mono border-b border-amber-600 shadow-sm animate-slide-up sticky top-0 z-50">
                <div className="flex items-center gap-2">
                  <MicOff className="w-4 h-4 text-slate-950 shrink-0" />
                  <span className="font-semibold">
                    Microphone access is required for live detection. Enable it in your browser's site settings to use this feature.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const res = await requestMicPermission();
                      if (res === 'granted') setIsBannerDismissed(true);
                    }}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                  <button
                    onClick={() => setIsBannerDismissed(true)}
                    className="p-1 text-slate-900 hover:text-slate-950 hover:bg-amber-400 rounded transition-colors"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Top Fixed Header */}
            <header className="sticky top-0 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40 z-40 px-4 md:px-stack-lg flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              
              <div className="flex items-center gap-3">
                <h1 className="font-headline-md text-lg font-bold text-primary capitalize">
                  {getHeaderTitle(currentTab)}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 bg-secondary-container/40 text-secondary font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-secondary/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Neural Guard Live
                </span>
              </div>

              <div className="flex items-center gap-4">
                
                {/* Notification bell */}
                <div 
                  className="relative p-2 text-on-surface-variant hover:text-primary cursor-pointer rounded-lg hover:bg-surface-container transition-colors"
                  onClick={() => setNotificationCount(0)}
                  title="Security Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
                  )}
                </div>

                {/* Exit to Landing Site */}
                <button
                  onClick={() => setCurrentTab('home')}
                  className="font-mono text-xs text-secondary hover:text-primary hover:underline transition-all flex items-center gap-1"
                >
                  <span>Exit to Overview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

              </div>
            </header>

            {/* Main Consolidated Page Render */}
            <main className="flex-1 pb-12">
              {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
              {currentTab === 'analytics' && <AnalyticsPage initialTab="overview" />}
              {currentTab === 'logs' && <AnalyticsPage initialTab="logs" />}
              {currentTab === 'api-sandbox' && <ApiSandboxPage />}
              {currentTab === 'settings' && <SettingsPage initialTab="general" />}
            </main>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;
