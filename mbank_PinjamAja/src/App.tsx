import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import BottomNav from '@/components/BottomNav';
import KYCGuard from '@/components/KYCGuard';
import { Loader2, Lock } from 'lucide-react';

// Pages
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import LoansPage from '@/pages/LoansPage';
import LoanDetailPage from '@/pages/LoanDetailPage';
import LoanApplyPage from '@/pages/LoanApplyPage';
import QRISPage from '@/pages/QRISPage';
import SavingsPage from '@/pages/SavingsPage';
import InsurancePage from '@/pages/InsurancePage';
import AccountPage from '@/pages/AccountPage';
import NotificationsPage from '@/pages/NotificationsPage';
import TransactionHistoryPage from '@/pages/TransactionHistoryPage';
import SecurityPage from '@/pages/SecurityPage';
import DevicesPage from '@/pages/DevicesPage';
import HelpPage from '@/pages/HelpPage';
import KYCPage from '@/pages/KYCPage';
import InsuranceBuyPage from '@/pages/InsuranceBuyPage';
import ExplorePage from '@/pages/ExplorePage';
import ChatPage from '@/pages/ChatPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/stores/savingsStore';
import { useLoanStore } from '@/stores/loanStore';
import { useNotificationStore } from '@/stores/notificationStore';

function MobileAppRoutes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const fetchTransactions = useSavingsStore((s) => s.fetchTransactions);
  const fetchLoans = useLoanStore((s) => s.fetchLoans);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchLoans();
      fetchNotifications();
      
      const interval = setInterval(() => {
        fetchNotifications();
        fetchLoans();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Session Timeout Policies
  useEffect(() => {
    if (!isAuthenticated) return;

    let idleTimer: any;
    let absoluteTimer: any;

    const resetTimers = () => {
      clearTimeout(idleTimer);
      // Idle 5 minutes -> lock app (requires PIN to unlock)
      idleTimer = setTimeout(() => {
        useAuthStore.setState({ isAuthenticated: false });
        console.warn('Sesi dikunci karena tidak ada aktivitas selama 5 menit.');
      }, 300000);
    };

    // Absolute timeout 30 minutes -> complete logout
    absoluteTimer = setTimeout(() => {
      logout();
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
    }, 1800000);

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimers();

    activityEvents.forEach(e => window.addEventListener(e, handleActivity));
    resetTimers();

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(absoluteTimer);
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [isAuthenticated, logout]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.08)',
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />
        <Route path="/explore" element={<AuthGuard><ExplorePage /></AuthGuard>} />
        <Route path="/loans" element={<AuthGuard><KYCGuard featureName="Akses Pinjaman"><LoansPage /></KYCGuard></AuthGuard>} />
        <Route path="/loan/:id" element={<AuthGuard><KYCGuard featureName="Detail Pinjaman"><LoanDetailPage /></KYCGuard></AuthGuard>} />
        <Route path="/loan/apply" element={<AuthGuard><KYCGuard featureName="Pengajuan Pinjaman"><LoanApplyPage /></KYCGuard></AuthGuard>} />
        <Route path="/qris" element={<AuthGuard><QRISPage /></AuthGuard>} />
        <Route path="/savings" element={<AuthGuard><SavingsPage /></AuthGuard>} />
        <Route path="/insurance" element={<AuthGuard><InsurancePage /></AuthGuard>} />
        <Route path="/account" element={<AuthGuard><AccountPage /></AuthGuard>} />
        <Route path="/notifications" element={<AuthGuard><NotificationsPage /></AuthGuard>} />
        <Route path="/transactions" element={<AuthGuard><TransactionHistoryPage /></AuthGuard>} />
        <Route path="/security" element={<AuthGuard><SecurityPage /></AuthGuard>} />
        <Route path="/devices" element={<AuthGuard><DevicesPage /></AuthGuard>} />
        <Route path="/help" element={<AuthGuard><HelpPage /></AuthGuard>} />
        <Route path="/kyc" element={<AuthGuard><KYCPage /></AuthGuard>} />
        <Route path="/insurance/buy/:id" element={<AuthGuard><InsuranceBuyPage /></AuthGuard>} />
        <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const restoreSession = useAuthStore(s => s.restoreSession);
  const [initializing, setInitializing] = useState(true);
  const [splashMessage, setSplashMessage] = useState('Checking Secure Session...');

  useEffect(() => {
    const init = async () => {
      setSplashMessage('Checking Secure Session...');
      await new Promise(r => setTimeout(r, 600));
      setSplashMessage('Verifying Trusted Device...');
      await new Promise(r => setTimeout(r, 600));
      setSplashMessage('Preparing Your Dashboard...');
      await restoreSession();
      setInitializing(false);
    };
    init();
  }, []);

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh]" style={{ background: 'var(--color-bg)', maxWidth: 480, margin: '0 auto', boxShadow: '0 0 40px rgba(0,0,0,0.08)' }}>
        <div className="text-center space-y-6 animate-fade-in p-6">
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>PinjamAJA</h1>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
              <span>{splashMessage}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MobileAppRoutes />
    </BrowserRouter>
  );
}
