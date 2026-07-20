import type { UserRole } from '@/types';

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features: string[];
  comingSoon?: boolean;
}

export default function ModulePlaceholder({ title, subtitle, icon, features }: ModulePlaceholderProps) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)' }}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <div key={i} className="rounded-xl p-4 card-hover cursor-pointer"
            style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{feature}</p>
            </div>
            <div className="h-24 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-elevated)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Module content</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shortcut to check role access
export function hasRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
