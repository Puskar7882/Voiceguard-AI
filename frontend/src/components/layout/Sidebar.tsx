import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Activity, 
  BarChart3, 
  Sliders, 
  Code2, 
  LogOut,
  Building2,
  ChevronUp,
  ChevronRight,
  User,
  Paintbrush,
  Settings,
  HelpCircle,
  FileText,
  Bug
} from 'lucide-react';
import { getStoredUser, clearAuthToken } from '../../services/api';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const user = getStoredUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  /* â”€â”€â”€ Close on outside click â”€â”€â”€ */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        chipRef.current && !chipRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        setConfirmingLogout(false);
        setHelpExpanded(false);
        setProfileExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  /* â”€â”€â”€ Close on Escape â”€â”€â”€ */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setConfirmingLogout(false);
        setHelpExpanded(false);
        setProfileExpanded(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const handleLogout = useCallback(() => {
    clearAuthToken();
    setMenuOpen(false);
    setConfirmingLogout(false);
    onNavigate('auth');
  }, [onNavigate]);

  const closeAndNavigate = useCallback((tab: string) => {
    setMenuOpen(false);
    setHelpExpanded(false);
    setProfileExpanded(false);
    onNavigate(tab);
  }, [onNavigate]);

  // 4 primary navigation destinations
  const navItems = [
    { id: 'dashboard', label: 'Interception', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'api-sandbox', label: 'API & Bank Sandbox', icon: Code2 },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const displayName = user ? user.email.split('@')[0] : 'Admin User';
  const displayEmail = user ? user.email : 'admin@voiceguard.ai';
  const displayRole = user?.role || 'user';
  const displayPlan = displayRole.charAt(0).toUpperCase() + displayRole.slice(1);

  /* shared menu-item classes */
  const menuItemCls = 'w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors text-left rounded-none';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Brand Header */}
      <div 
        onClick={() => onNavigate('home')}
        className="p-stack-md flex items-center gap-3 mb-2 cursor-pointer border-b border-outline-variant/30"
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-[#0D9488] shadow-sm">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline-md text-base font-bold text-primary tracking-tight">VoiceGuard</span>
          <span className="font-mono text-[10px] text-secondary font-semibold uppercase tracking-wider">Interception Hub</span>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-stack-sm py-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => displayRole === 'admin' ? true : !['api-sandbox', 'settings'].includes(item.id)).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || 
            (item.id === 'analytics' && currentTab === 'logs');
            
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm transition-all duration-150 text-left font-medium ${
                isActive
                  ? 'bg-secondary-container/40 text-on-secondary-container font-semibold border-l-4 border-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile / Plan Badge â€” clickable chip */}
      <div className="relative p-stack-md border-t border-outline-variant/40 bg-surface-container-lowest">

        {/* â”€â”€ Dropdown Menu (anchored above chip) â”€â”€ */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-3 right-3 mb-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 shadow-xl overflow-hidden animate-slide-up"
            style={{ zIndex: 60 }}
          >
            {/* â”€â”€ Logout confirm overlay â”€â”€ */}
            {confirmingLogout ? (
              <div className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-on-surface">
                  Sign out of VoiceGuard AI?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmingLogout(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors bg-error text-on-error hover:bg-error/90"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* â‘  Account header (display only) */}
                <div className="px-4 pt-3 pb-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-container/60 border border-secondary/30 flex items-center justify-center text-secondary font-bold text-xs shrink-0">
                    {user ? user.email.substring(0, 2).toUpperCase() : 'AU'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-xs font-semibold text-on-surface truncate">{displayName}</span>
                    <div className="mt-1 inline-flex items-center gap-1 bg-secondary-container/50 text-secondary font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border border-secondary/25 uppercase w-fit">
                      <Building2 className="w-3 h-3" />
                      {displayPlan}
                    </div>
                  </div>
                </div>

                {/* â”€ divider â”€ */}
                <div className="h-px bg-outline-variant/40 mx-3" />

                {/* â‘¡ Personalization */}
                <button
                  onClick={() => closeAndNavigate('settings')}
                  className={menuItemCls}
                >
                  <Paintbrush className="w-3.5 h-3.5 text-on-surface-variant" />
                  Personalization
                </button>

                {/* â‘¢ Profile (expandable inline panel) */}
                <button
                  onClick={() => { setProfileExpanded(p => !p); setHelpExpanded(false); }}
                  className={menuItemCls}
                >
                  <User className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="flex-1">Profile</span>
                  <ChevronRight className={`w-3 h-3 text-on-surface-variant transition-transform duration-200 ${profileExpanded ? 'rotate-90' : ''}`} />
                </button>
                {profileExpanded && (
                  <div className="mx-4 mb-1 px-3 py-2.5 bg-surface-container rounded-lg">
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Name</span>
                        <span className="text-on-surface font-medium truncate ml-3">{displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Email</span>
                        <span className="text-on-surface font-medium truncate ml-3">{displayEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Role</span>
                        <span className="text-on-surface font-medium capitalize ml-3">{displayRole}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* â‘£ Settings */}
                <button
                  onClick={() => closeAndNavigate('settings')}
                  className={menuItemCls}
                >
                  <Settings className="w-3.5 h-3.5 text-on-surface-variant" />
                  Settings
                </button>

                {/* â”€ divider â”€ */}
                <div className="h-px bg-outline-variant/40 mx-3" />

                {/* â‘¤ Help (expandable sub-panel) */}
                <button
                  onClick={() => { setHelpExpanded(h => !h); setProfileExpanded(false); }}
                  className={menuItemCls}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="flex-1">Help</span>
                  <ChevronRight className={`w-3 h-3 text-on-surface-variant transition-transform duration-200 ${helpExpanded ? 'rotate-90' : ''}`} />
                </button>
                {helpExpanded && (
                  <div className="mx-4 mb-1 flex flex-col bg-surface-container rounded-lg overflow-hidden">
                    <button
                      onClick={() => closeAndNavigate('api-sandbox')}
                      className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-on-surface hover:bg-surface-container-high transition-colors text-left"
                    >
                      <FileText className="w-3 h-3 text-on-surface-variant" />
                      API documentation
                    </button>
                    <a
                      href="mailto:support@voiceguard.ai?subject=Issue Report â€” VoiceGuard AI"
                      className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-on-surface hover:bg-surface-container-high transition-colors text-left"
                    >
                      <Bug className="w-3 h-3 text-on-surface-variant" />
                      Report an issue
                    </a>
                  </div>
                )}

                {/* â”€ divider â”€ */}
                <div className="h-px bg-outline-variant/40 mx-3" />

                {/* â‘¥ Log out (danger) */}
                <button
                  onClick={() => setConfirmingLogout(true)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-error/80 hover:text-error hover:bg-error-container/20 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </>
            )}
          </div>
        )}

        {/* â”€â”€ Profile Chip (click target) â”€â”€ */}
        <div
          ref={chipRef}
          onClick={() => { setMenuOpen(prev => !prev); setConfirmingLogout(false); setHelpExpanded(false); setProfileExpanded(false); }}
          className={`flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
            menuOpen ? 'bg-surface-container' : 'hover:bg-surface-container/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container/60 border border-secondary/30 flex items-center justify-center text-secondary font-bold text-xs">
              {user ? user.email.substring(0, 2).toUpperCase() : 'AU'}
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-xs font-semibold text-on-surface truncate max-w-[110px]">
                {displayName}
              </span>
              <span className="font-label-sm text-[11px] text-secondary flex items-center gap-1 font-mono uppercase">
                <Building2 className="w-3 h-3" />
                {displayPlan}
              </span>
            </div>
          </div>
          <ChevronUp className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${menuOpen ? '' : 'rotate-180'}`} />
        </div>
      </div>
    </aside>
  );
};
