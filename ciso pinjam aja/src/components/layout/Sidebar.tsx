import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ShieldAlert, Scale, FileCheck, Map, Bug, AlertTriangle,
  Server, Database, UserCog, GraduationCap, ClipboardCheck, BarChart3,
  Gauge, Code2, Settings, ChevronLeft, ChevronRight, Shield, Lock, Activity,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
  badge?: number;
  badgeType?: 'danger' | 'warning' | 'info';
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: 'STRATEGIC',
    items: [
      { id: 'executive', label: 'Executive Command Center', icon: <LayoutDashboard size={20} />, path: '/', roles: ['super_admin', 'ciso'] },
      { id: 'roadmap', label: 'Security Roadmap', icon: <Map size={20} />, path: '/roadmap', roles: ['super_admin', 'ciso'] },
      { id: 'kpi', label: 'KPI Engine', icon: <Gauge size={20} />, path: '/kpi', roles: ['super_admin', 'ciso', 'compliance_officer', 'risk_manager'] },
    ],
  },
  {
    title: 'GRC',
    items: [
      { id: 'risk', label: 'Risk Management', icon: <ShieldAlert size={20} />, path: '/risk', roles: ['super_admin', 'ciso', 'compliance_officer', 'risk_manager'] },
      { id: 'compliance', label: 'Compliance Management', icon: <Scale size={20} />, path: '/compliance', roles: ['super_admin', 'ciso', 'compliance_officer'] },
      { id: 'kyc-queue', label: 'KYC Queue', icon: <UserCog size={20} />, path: '/kyc-queue', roles: ['super_admin', 'ciso', 'compliance_officer'] },
      { id: 'governance', label: 'Security Governance', icon: <FileCheck size={20} />, path: '/governance', roles: ['super_admin', 'ciso', 'compliance_officer', 'risk_manager'] },
      { id: 'audit', label: 'Audit Management', icon: <ClipboardCheck size={20} />, path: '/audit', roles: ['super_admin', 'ciso', 'compliance_officer'] },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { id: 'incidents', label: 'Incident Management', icon: <AlertTriangle size={20} />, path: '/incidents', roles: ['super_admin', 'ciso', 'soc_analyst'], badge: 3, badgeType: 'danger' },
      { id: 'vulnerability', label: 'Vulnerability Management', icon: <Bug size={20} />, path: '/vulnerability', roles: ['super_admin', 'ciso', 'soc_analyst', 'it_infrastructure'] },
      { id: 'assets', label: 'Asset Management', icon: <Server size={20} />, path: '/assets', roles: ['super_admin', 'ciso', 'soc_analyst', 'it_infrastructure'] },
    ],
  },
  {
    title: 'PROTECTION',
    items: [
      { id: 'data-protection', label: 'Data Protection Center', icon: <Database size={20} />, path: '/data-protection', roles: ['super_admin', 'ciso', 'compliance_officer'] },
      { id: 'iam', label: 'Identity & Access Mgmt', icon: <UserCog size={20} />, path: '/iam', roles: ['super_admin', 'ciso'] },
      { id: 'awareness', label: 'Security Awareness', icon: <GraduationCap size={20} />, path: '/awareness', roles: ['super_admin', 'ciso'] },
    ],
  },
  {
    title: 'ENGINEERING',
    items: [
      { id: 'sdlc', label: 'Secure SDLC', icon: <Code2 size={20} />, path: '/sdlc', roles: ['super_admin', 'ciso', 'dev_team'] },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { id: 'reports', label: 'Transaction Security Center', icon: <Activity size={20} />, path: '/transactions', roles: ['super_admin', 'ciso', 'soc_analyst', 'compliance_officer', 'risk_manager'] },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings & Admin', icon: <Settings size={20} />, path: '/settings', roles: ['super_admin'] },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  const filteredGroups = sidebarGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!user) return false;
        return item.roles.includes(user.role) && hasPermission(item.id);
      }),
    }))
    .filter(group => group.items.length > 0);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{
        background: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))' }}>
          <Shield size={20} color="white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
              SecureNusa
            </h1>
            <p className="text-[10px] whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
              EISMS Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {filteredGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="text-[10px] font-semibold tracking-wider px-3 mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative ${
                      collapsed ? 'justify-center' : ''
                    }`}
                    style={{
                      color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                      background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: 'var(--color-accent-blue)' }} />
                    )}
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                        item.badgeType === 'danger' ? 'bg-red-500' :
                        item.badgeType === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
                        style={{
                          background: 'var(--color-bg-elevated)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}>
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Security Badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={12} style={{ color: 'var(--color-accent-blue)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-accent-blue)' }}>PLATFORM SECURED</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            TLS 1.3 • AES-256 • SOC 2
          </p>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t transition-colors duration-200"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
