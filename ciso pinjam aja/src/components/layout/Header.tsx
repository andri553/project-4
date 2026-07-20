import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/data/users';
import {
  Sun, Moon, Bell, Search, LogOut, ChevronDown, User, Check,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { UserRole } from '@/types';

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Executive Command Center',
  '/risk': 'Risk Management',
  '/compliance': 'Compliance Management',
  '/governance': 'Security Governance',
  '/roadmap': 'Security Roadmap',
  '/vulnerability': 'Vulnerability Management',
  '/incidents': 'Incident Management',
  '/assets': 'Asset Management',
  '/data-protection': 'Data Protection Center',
  '/iam': 'Identity & Access Management',
  '/awareness': 'Security Awareness Center',
  '/audit': 'Audit Management',
  '/reports': 'Reports & Analytics',
  '/kpi': 'KPI Engine',
  '/sdlc': 'Secure SDLC',
  '/settings': 'Settings & Administration',
};

const THEMES = [
  { id: 'light', label: 'Classic Light', desc: 'Neon blue & purple accents', icon: Sun, dotColor: '#3B82F6' },
  { id: 'mature-dark', label: 'Mature Dark', desc: 'Warm bronze & sage accents', icon: Moon, dotColor: '#C5A880' },
] as const;

export default function Header() {
  const { user, logout, loginAsRole } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const currentPage = BREADCRUMB_MAP[location.pathname] || 'SecureNusa EISMS';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, type: 'danger', title: 'Critical Vulnerability Detected', desc: 'SQL injection in reporting module – SLA: 7 days', time: '5 min ago' },
    { id: 2, type: 'warning', title: 'Compliance Deadline Approaching', desc: 'UU PDP consent management due in 127 days', time: '2 hours ago' },
    { id: 3, type: 'info', title: 'Audit Report Available', desc: 'Q2 2026 Internal Security Audit completed', time: '1 day ago' },
    { id: 4, type: 'danger', title: 'Active Security Incident', desc: 'Suspicious API calls to QRIS endpoint under investigation', time: '12 hours ago' },
  ];

  const allRoles: UserRole[] = ['super_admin', 'ciso', 'soc_analyst', 'compliance_officer', 'risk_manager', 'it_infrastructure', 'dev_team'];

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b"
      style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            SECURENUSA EISMS
          </p>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {currentPage}
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {showSearch ? (
            <div className="animate-scale-in flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
              <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
              <input
                autoFocus
                placeholder="Search modules, risks, controls..."
                className="bg-transparent text-sm outline-none w-52"
                style={{ color: 'var(--color-text-primary)' }}
                onBlur={() => setShowSearch(false)}
              />
            </div>
          ) : (
            <button onClick={() => setShowSearch(true)} className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Theme Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg transition-colors flex items-center justify-center"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="Switch Theme"
          >
            {theme.includes('dark') ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {showThemeMenu && (
            <div className="animate-scale-in absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden shadow-2xl z-50 p-2"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              <div className="px-2 py-1.5 border-b mb-1" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] font-semibold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  SELECT DESIGN THEME
                </p>
              </div>
              <div className="space-y-0.5">
                {THEMES.map((t) => {
                  const IconComponent = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer text-inherit"
                      style={{
                        background: isSelected ? 'var(--color-bg-elevated)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="mt-0.5 relative">
                        <IconComponent size={14} style={{ color: isSelected ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)' }} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: t.dotColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold" style={{ color: isSelected ? 'var(--color-accent-blue)' : 'var(--color-text-primary)' }}>
                            {t.label}
                          </p>
                          {isSelected && <Check size={12} style={{ color: 'var(--color-accent-blue)' }} />}
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg transition-colors relative"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {showNotifications && (
            <div className="animate-scale-in absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="flex gap-3 p-3 border-b cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'danger' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>{n.desc}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 mx-1" style={{ background: 'var(--color-border)' }} />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: user ? ROLE_COLORS[user.role] : '#666' }}>
              {user?.avatar || <User size={16} />}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium truncate max-w-[120px]" style={{ color: 'var(--color-text-primary)' }}>
                {user?.name || 'Guest'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {user ? ROLE_LABELS[user.role] : 'Not logged in'}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {showUserMenu && (
            <div className="animate-scale-in absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              {/* Current user info */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                  style={{ background: user ? ROLE_COLORS[user.role] : '#666' }}>
                  {user ? ROLE_LABELS[user.role] : 'N/A'}
                </span>
              </div>

              {/* Switch Role (Demo) */}
              <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] font-semibold tracking-wider px-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  SWITCH ROLE (DEMO)
                </p>
                {allRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => { loginAsRole(role); setShowUserMenu(false); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                      user?.role === role ? 'font-semibold' : ''
                    }`}
                    style={{
                      color: user?.role === role ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                      background: user?.role === role ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (user?.role !== role) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={(e) => { if (user?.role !== role) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[role] }} />
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="p-2">
                <button onClick={logout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-400 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
