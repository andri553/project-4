import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Landmark, QrCode, Shield, UserCircle } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/loans', label: 'Loan', icon: Landmark },
  { path: '/qris', label: 'QRIS', icon: QrCode },
  { path: '/insurance', label: 'Insurance', icon: Shield },
  { path: '/account', label: 'Account', icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on certain pages
  const hiddenPaths = ['/login', '/loan/apply', '/ciso', '/kyc'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="glass safe-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 0 8px',
        zIndex: 40,
        borderTop: '1px solid var(--color-border-light)',
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        const Icon = tab.icon;
        
        if (tab.path === '/qris') {
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                position: 'relative',
                marginTop: -14,
              }}
              aria-label={tab.label}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: active
                    ? 'var(--color-primary)'
                    : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-blue)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <Icon size={24} />
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  letterSpacing: '0.01em',
                  marginTop: 2,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '4px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              position: 'relative',
            }}
            aria-label={tab.label}
          >
            <Icon
              size={22}
              color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                letterSpacing: '0.01em',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
