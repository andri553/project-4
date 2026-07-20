import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Tablet, Monitor, LogOut, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { devices as mockDevices } from '@/data/mockData';
import { formatDate } from '@/helpers/format';
import type { Device } from '@/types';

import { logAudit } from '@/stores/auditStore';

export default function DevicesPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user)!;
  
  // Use local state to allow removing devices visually
  const [devices, setDevices] = useState<Device[]>(mockDevices.filter(d => d.userId === user.id));

  const handleRevoke = (deviceId: string) => {
    const targetDevice = devices.find(d => d.id === deviceId);
    const deviceName = targetDevice ? targetDevice.deviceName : 'Unknown Device';
    
    if (confirm('Apakah Anda yakin ingin mengeluarkan akun dari perangkat ini?')) {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      logAudit(
        user.id,
        user.fullName,
        'SECURITY',
        'DEVICE_REMOVED',
        `Revoked access for trusted device: ${deviceName}`,
        'success',
        { deviceId, deviceName }
      );
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone size={24} color="var(--color-primary)" />;
      case 'desktop': return <Laptop size={24} color="var(--color-primary)" />;
      case 'tablet': return <Tablet size={24} color="var(--color-primary)" />;
      default: return <Monitor size={24} color="var(--color-primary)" />;
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Perangkat Terdaftar" onBack={() => navigate('/account')} />

      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Daftar perangkat yang memiliki akses ke akun Anda. Jika ada perangkat yang tidak dikenali, segera hapus aksesnya.
        </p>

        <div className="stagger-children">
          {devices.map((device) => (
            <div key={device.id} className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-50)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {getDeviceIcon(device.deviceType)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>{device.deviceName}</h3>
                    {device.isCurrentDevice && (
                      <span className="badge badge-success" style={{ fontSize: 9 }}>Saat Ini</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{device.os} · {device.browser}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>{device.location} · {device.ipAddress}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    <CheckCircle2 size={12} color="var(--color-success)" />
                    Terakhir aktif {formatDate(device.lastActiveAt, 'relative')}
                  </div>
                  
                  {!device.isCurrentDevice && (
                    <button
                      onClick={() => handleRevoke(device.id)}
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-danger)', borderColor: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <LogOut size={12} /> Hapus Akses
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {devices.length === 0 && (
             <div style={{ textAlign: 'center', padding: 48 }}>
               <Smartphone size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
               <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tidak ada perangkat terdaftar</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
