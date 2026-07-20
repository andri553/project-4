import { create } from 'zustand';
import type { AuditLog, AuditCategory, SecurityEvent, SecurityEventSeverity } from '@/types';
import { auditLogs as initialAuditLogs, securityEvents as initialSecurityEvents } from '@/data/mockData';

let auditCounter = initialAuditLogs.length + 1;
let securityCounter = initialSecurityEvents.length + 1;

interface AuditStore {
  auditLogs: AuditLog[];
  securityEvents: SecurityEvent[];

  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;
  addSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'createdAt'>) => void;
  getByCategory: (category: AuditCategory) => AuditLog[];
  getRecentLogs: (count: number) => AuditLog[];
  getRecentEvents: (count: number) => SecurityEvent[];
  clearLogs: () => void;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  auditLogs: [...initialAuditLogs],
  securityEvents: [...initialSecurityEvents],

  addAuditLog: (log) => {
    const newLog: AuditLog = {
      ...log,
      id: `AUD-${String(auditCounter++).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    
    // Background fetch to backend
    fetch('http://localhost:4000/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(e => console.error('Failed to send audit log', e));

    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs],
    }));
  },

  addSecurityEvent: (event) => {
    const newEvent: SecurityEvent = {
      ...event,
      id: `SE-${String(securityCounter++).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };

    // Background fetch to backend
    fetch('http://localhost:4000/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    }).catch(e => console.error('Failed to send security event', e));

    set((state) => ({
      securityEvents: [newEvent, ...state.securityEvents],
    }));
  },

  getByCategory: (category) => {
    return get().auditLogs.filter((l) => l.category === category);
  },

  getRecentLogs: (count) => {
    return get().auditLogs.slice(0, count);
  },

  getRecentEvents: (count) => {
    return get().securityEvents.slice(0, count);
  },

  clearLogs: () => {
    set({ auditLogs: [], securityEvents: [] });
  },
}));

// Helper to quickly log an audit event
export function logAudit(
  userId: string,
  userName: string,
  category: AuditCategory,
  action: string,
  description: string,
  status: 'success' | 'failure' = 'success',
  metadata?: Record<string, unknown>,
) {
  useAuditStore.getState().addAuditLog({
    userId,
    userName,
    category,
    action,
    description,
    status,
    ipAddress: '180.244.123.45',
    deviceInfo: 'Web Browser / PinjamAJA App',
    metadata,
  });
}

// Helper to quickly log a security event
export function logSecurityEvent(
  userId: string,
  userName: string,
  eventType: string,
  severity: SecurityEventSeverity,
  description: string,
  metadata?: Record<string, unknown>,
) {
  useAuditStore.getState().addSecurityEvent({
    userId,
    userName,
    eventType,
    severity,
    description,
    sourceIp: '180.244.123.45',
    deviceInfo: 'Web Browser / PinjamAJA App',
    resolved: false,
    metadata,
  });
}
