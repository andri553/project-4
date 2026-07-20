import { useNavigate } from 'react-router-dom';
import { Check, CheckCheck, Trash2, Bell, ShieldAlert, CreditCard, Megaphone, Lock, Mail } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDate } from '@/helpers/format';
import PageHeader from '@/components/PageHeader';
import type { NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  push: { icon: Megaphone, color: '#7C3AED', bg: '#7C3AED14' },
  otp: { icon: Lock, color: '#F59E0B', bg: '#F59E0B14' },
  security: { icon: ShieldAlert, color: '#EF4444', bg: '#EF444414' },
  loan: { icon: CreditCard, color: '#0066FF', bg: '#0066FF14' },
  transaction: { icon: CreditCard, color: '#10B981', bg: '#10B98114' },
  promo: { icon: Megaphone, color: '#06B6D4', bg: '#06B6D414' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader
        title="Notifikasi"
        onBack={() => navigate('/')}
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="btn-ghost"
              style={{ padding: 4, borderRadius: 'var(--radius-full)' }}
              aria-label="Tandai semua dibaca"
            >
              <CheckCheck size={18} color="var(--color-primary)" />
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: '8px 16px' }}>
        {unreadCount > 0 && (
          <div className="animate-fade-in" style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-dark)' }}>
              {unreadCount} notifikasi belum dibaca
            </span>
            <button
              onClick={markAllAsRead}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              Tandai semua dibaca
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Bell size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="stagger-children">
            {notifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.push;
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  className="animate-fade-in-up"
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 12px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 4,
                    background: notif.isRead ? 'transparent' : 'var(--color-primary-50)',
                    transition: 'background 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: config.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={config.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: 4 }}>
                      {notif.message}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      {formatDate(notif.createdAt, 'relative')}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="btn-ghost"
                    style={{ padding: 4, borderRadius: 'var(--radius-full)', flexShrink: 0, alignSelf: 'flex-start' }}
                  >
                    <Trash2 size={14} color="var(--color-text-muted)" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
