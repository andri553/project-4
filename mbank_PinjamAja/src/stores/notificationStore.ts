import { create } from 'zustand';
import type { Notification, NotificationType } from '@/types';
import { notifications as initialNotifications } from '@/data/mockData';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  getByType: (type: NotificationType) => Notification[];
  deleteNotification: (id: string) => void;
}

let notifCounter = initialNotifications.length + 1;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [...initialNotifications],
  unreadCount: initialNotifications.filter((n) => !n.isRead).length,

  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/v1/business/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((n: any) => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type as NotificationType,
          isRead: n.isRead,
          createdAt: n.createdAt
        }));
        set({
          notifications: mapped,
          unreadCount: mapped.filter((n) => !n.isRead).length
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },

  markAsRead: async (id) => {
    try {
      await fetch(`/api/v1/business/notifications/${id}/read`, { method: 'POST' });
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        };
      });
    } catch (err) {
      console.error(err);
    }
  },

  markAllAsRead: async () => {
    try {
      await fetch('/api/v1/business/notifications/read-all', { method: 'POST' });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error(err);
    }
  },

  addNotification: (notif) => {
    const newNotif: Notification = {
      ...notif,
      id: `NOTIF-${String(notifCounter++).padStart(3, '0')}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  getByType: (type) => {
    return get().notifications.filter((n) => n.type === type);
  },

  deleteNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },
}));
