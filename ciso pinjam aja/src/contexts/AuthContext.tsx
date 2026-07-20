import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, UserRole, Permission } from '@/types';
import { mockUsers } from '@/data/users';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  hasPermission: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canApprove: (module: string) => boolean;
}

// RBAC Permission Matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    { module: 'executive', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'risk', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'compliance', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'governance', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'roadmap', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'vulnerability', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'incidents', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'assets', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'data-protection', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'iam', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'awareness', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'audit', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'reports', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'kpi', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'sdlc', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'settings', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'kyc', canView: true, canEdit: true, canDelete: true, canApprove: true },
    { module: 'kyc-queue', canView: true, canEdit: true, canDelete: true, canApprove: true },
  ],
  ciso: [
    { module: 'executive', canView: true, canEdit: false, canDelete: false, canApprove: true },
    { module: 'risk', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'compliance', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'governance', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'roadmap', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'vulnerability', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'incidents', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'assets', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'data-protection', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'iam', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'awareness', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'audit', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'reports', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'kpi', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'sdlc', canView: true, canEdit: false, canDelete: false, canApprove: true },
    { module: 'settings', canView: false, canEdit: false, canDelete: false, canApprove: false },
    { module: 'kyc', canView: true, canEdit: true, canDelete: false, canApprove: true },
    { module: 'kyc-queue', canView: true, canEdit: true, canDelete: false, canApprove: true },
  ],
  soc_analyst: [
    { module: 'executive', canView: false, canEdit: false, canDelete: false, canApprove: false },
    { module: 'vulnerability', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'incidents', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'assets', canView: true, canEdit: false, canDelete: false, canApprove: false },
    { module: 'reports', canView: true, canEdit: false, canDelete: false, canApprove: false },
  ],
  compliance_officer: [
    { module: 'risk', canView: true, canEdit: false, canDelete: false, canApprove: false },
    { module: 'compliance', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'governance', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'data-protection', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'audit', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'reports', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'kpi', canView: true, canEdit: false, canDelete: false, canApprove: false },
  ],
  risk_manager: [
    { module: 'risk', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'governance', canView: true, canEdit: false, canDelete: false, canApprove: false },
    { module: 'reports', canView: true, canEdit: false, canDelete: false, canApprove: false },
    { module: 'kpi', canView: true, canEdit: false, canDelete: false, canApprove: false },
  ],
  it_infrastructure: [
    { module: 'vulnerability', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'assets', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'reports', canView: true, canEdit: false, canDelete: false, canApprove: false },
  ],
  dev_team: [
    { module: 'sdlc', canView: true, canEdit: true, canDelete: false, canApprove: false },
    { module: 'reports', canView: true, canEdit: false, canDelete: false, canApprove: false },
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('securenusa-user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('securenusa-user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_refresh_token');
  }, []);

  const login = useCallback(async (_email: string, _password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _email, password: _password })
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        const { token, refreshToken, user: backendUser } = json.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshToken);
        }
        
        const mappedUser: User = {
          id: backendUser.id,
          name: backendUser.fullName,
          email: backendUser.email,
          role: backendUser.role,
          avatar: backendUser.avatarUrl || backendUser.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          department: '',
          title: '',
          lastLogin: backendUser.lastLoginAt || new Date().toISOString(),
          mfaEnabled: backendUser.mfaEnabled,
          status: backendUser.isActive ? 'Active' : 'Inactive'
        };
        
        setUser(mappedUser);
        localStorage.setItem('securenusa-user', JSON.stringify(mappedUser));
        return true;
      } else if (res.status === 429 || !json.success) {
        throw new Error(json.message || 'Invalid credentials');
      }
    } catch (e: any) {
      console.warn('Backend login failed', e);
      throw e;
    }

    const foundUser = mockUsers.find(u => u.email === _email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('securenusa-user', JSON.stringify(foundUser));
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('token', 'mock_token');
      return true;
    }
    const cisoUser = mockUsers.find(u => u.role === 'ciso')!;
    setUser(cisoUser);
    localStorage.setItem('securenusa-user', JSON.stringify(cisoUser));
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem('token', 'mock_token');
    return true;
  }, []);

  const loginAsRole = useCallback(async (role: UserRole) => {
    const ROLE_EMAILS: Record<UserRole, string> = {
      super_admin: 'admin@pinjamaja.co.id',
      ciso: 'ciso@pinjamaja.co.id',
      soc_analyst: 'soc@pinjamaja.co.id',
      compliance_officer: 'compliance@pinjamaja.co.id',
      risk_manager: 'risk@pinjamaja.co.id',
      it_infrastructure: 'infra@pinjamaja.co.id',
      dev_team: 'dev@pinjamaja.co.id',
    };

    const email = ROLE_EMAILS[role];
    if (email) {
      try {
        const success = await login(email, 'CISO123!');
        if (success) return;
      } catch (err: any) {
        alert(`Login failed: ${err.message || 'Backend connection error'}`);
        return;
      }
    }

    const roleUser = mockUsers.find(u => u.role === role);
    if (roleUser) {
      setUser(roleUser);
      localStorage.setItem('securenusa-user', JSON.stringify(roleUser));
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('token', 'mock_token');
    }
  }, [login]);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || token === 'mock_token') return;
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success && json.data?.user) {
          const backendUser = json.data.user;
          const mappedUser: User = {
            id: backendUser.id,
            name: backendUser.fullName,
            email: backendUser.email,
            role: backendUser.role,
            avatar: backendUser.avatarUrl || backendUser.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
            department: '',
            title: '',
            lastLogin: backendUser.lastLoginAt || new Date().toISOString(),
            mfaEnabled: backendUser.mfaEnabled,
            status: backendUser.isActive ? 'Active' : 'Inactive'
          };
          setUser(mappedUser);
          localStorage.setItem('securenusa-user', JSON.stringify(mappedUser));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Failed to validate token on backend', err);
      }
    };
    validateToken();
  }, [logout]);

  const getPermissions = useCallback((): Permission[] => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user]);

  const hasPermission = useCallback((module: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const perms = getPermissions();
    const perm = perms.find(p => p.module === module);
    return perm?.canView ?? false;
  }, [user, getPermissions]);

  const canEdit = useCallback((module: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const perms = getPermissions();
    const perm = perms.find(p => p.module === module);
    return perm?.canEdit ?? false;
  }, [user, getPermissions]);

  const canApprove = useCallback((module: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const perms = getPermissions();
    const perm = perms.find(p => p.module === module);
    return perm?.canApprove ?? false;
  }, [user, getPermissions]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginAsRole,
      logout,
      hasPermission,
      canEdit,
      canApprove,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
