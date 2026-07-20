import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Eye, EyeOff, Sun, Moon, Check } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS } from '@/data/users';
import type { UserRole } from '@/types';

const THEMES = [
  { id: 'light', label: 'Classic Light', desc: 'Neon accents, light background', icon: Sun, dotColor: '#3B82F6' },
  { id: 'mature-dark', label: 'Mature Dark', desc: 'Bronze/sage, dark background', icon: Moon, dotColor: '#C5A880' },
] as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsRole, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('ciso@pinjamaja.co.id');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await new Promise(r => setTimeout(r, 800));
      const success = await login(email, password);
      if (!success) setError('Invalid credentials');
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    loginAsRole(role);
  };

  const quickRoles: { role: UserRole; desc: string }[] = [
    { role: 'super_admin', desc: 'Full system access' },
    { role: 'ciso', desc: 'Executive security oversight' },
    { role: 'soc_analyst', desc: 'Security operations' },
    { role: 'compliance_officer', desc: 'Regulatory compliance' },
    { role: 'risk_manager', desc: 'Risk assessment & treatment' },
    { role: 'it_infrastructure', desc: 'Infrastructure security' },
    { role: 'dev_team', desc: 'Secure SDLC' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0B1527 0%, #1E3A5F 50%, #0B1527 100%)' }}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--color-accent-blue) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--color-accent-purple) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--color-accent-cyan) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))' }}>
              <Shield size={22} color="white" />
            </div>
            <span className="text-sm font-medium text-blue-300">PinjamAJA</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            SecureNusa
          </h1>
          <p className="text-lg text-blue-200 mb-2 font-medium">
            Enterprise Information Security Management System
          </p>
          <p className="text-sm text-blue-300/70 leading-relaxed mb-8">
            Unified Governance, Risk & Compliance platform powering the SatuNusa Expansion Initiative —
            connecting business objectives to security controls, compliance evidence, and executive decisions.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '5M+', label: 'Active Users Protected' },
              { value: '3', label: 'Expansion Initiatives' },
              { value: '99.7%', label: 'Encryption Coverage' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-blue-300/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[11px] text-blue-300/40">
            © 2026 PinjamAJA. SecureNusa EISMS v1.0 • ISO 27001 Aligned
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Theme Dropdown */}
        <div className="absolute top-6 right-6" ref={themeRef}>
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

        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile Brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))' }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>SecureNusa</h1>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>EISMS Platform</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Sign in to SecureNusa
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Access the Enterprise Information Security Management System
          </p>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-blue)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors pr-10"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-blue)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-blue-hover))' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In with MFA'}
            </button>
          </form>

          {/* Quick Access */}
          <div>
            <p className="text-[10px] font-semibold tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              QUICK ACCESS — SELECT ROLE
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {quickRoles.map(({ role, desc }) => (
                <button
                  key={role}
                  onClick={() => handleQuickLogin(role)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group"
                  style={{ border: '1px solid var(--color-border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.borderColor = ROLE_COLORS[role]; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ROLE_COLORS[role] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {ROLE_LABELS[role]}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
