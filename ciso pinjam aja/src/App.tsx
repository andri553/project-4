import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { GovernanceProvider } from '@/contexts/GovernanceContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import ExecutiveCommandCenter from '@/pages/dashboard/ExecutiveCommandCenter';
import { Lock } from 'lucide-react';
import {
  RiskManagementPage, ComplianceManagementPage, SecurityGovernancePage,
  SecurityRoadmapPage, VulnerabilityManagementPage, IncidentManagementPage,
  AssetManagementPage, DataProtectionPage, IAMPage, SecurityAwarenessPage,
  AuditManagementPage, KPIEnginePage, SecureSDLCPage, SettingsPage,
} from '@/pages/ModulePages';
import KYCVerificationQueue from '@/pages/KYCVerificationQueue';
import TransactionMonitorPage from '@/pages/TransactionMonitorPage';

function ProtectedRoute({ children, module }: { children: React.ReactNode; module?: string }) {
  const { isAuthenticated, hasPermission } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (module && !hasPermission(module)) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <div className="text-center p-8 rounded-xl" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex justify-center mb-4 text-red-500">
            <Lock size={40} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Access Denied</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            You don't have permission to access this module.<br />
            Contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GovernanceProvider>
          <WorkflowProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<ProtectedRoute module="executive"><ExecutiveCommandCenter /></ProtectedRoute>} />
                          <Route path="/risk" element={<ProtectedRoute module="risk"><RiskManagementPage /></ProtectedRoute>} />
                          <Route path="/compliance" element={<ProtectedRoute module="compliance"><ComplianceManagementPage /></ProtectedRoute>} />
                          <Route path="/governance" element={<ProtectedRoute module="governance"><SecurityGovernancePage /></ProtectedRoute>} />
                          <Route path="/roadmap" element={<ProtectedRoute module="roadmap"><SecurityRoadmapPage /></ProtectedRoute>} />
                          <Route path="/vulnerability" element={<ProtectedRoute module="vulnerability"><VulnerabilityManagementPage /></ProtectedRoute>} />
                          <Route path="/incidents" element={<ProtectedRoute module="incidents"><IncidentManagementPage /></ProtectedRoute>} />
                          <Route path="/assets" element={<ProtectedRoute module="assets"><AssetManagementPage /></ProtectedRoute>} />
                          <Route path="/data-protection" element={<ProtectedRoute module="data-protection"><DataProtectionPage /></ProtectedRoute>} />
                          <Route path="/iam" element={<ProtectedRoute module="iam"><IAMPage /></ProtectedRoute>} />
                          <Route path="/awareness" element={<ProtectedRoute module="awareness"><SecurityAwarenessPage /></ProtectedRoute>} />
                          <Route path="/audit" element={<ProtectedRoute module="audit"><AuditManagementPage /></ProtectedRoute>} />
                          <Route path="/transactions" element={<ProtectedRoute module="reports"><TransactionMonitorPage /></ProtectedRoute>} />
                          <Route path="/kpi" element={<ProtectedRoute module="kpi"><KPIEnginePage /></ProtectedRoute>} />
                          <Route path="/sdlc" element={<ProtectedRoute module="sdlc"><SecureSDLCPage /></ProtectedRoute>} />
                          <Route path="/settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
                          <Route path="/kyc" element={<ProtectedRoute module="kyc"><KYCVerificationQueue /></ProtectedRoute>} />
                          <Route path="/kyc-queue" element={<ProtectedRoute module="kyc-queue"><KYCVerificationQueue /></ProtectedRoute>} />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </WorkflowProvider>
        </GovernanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
