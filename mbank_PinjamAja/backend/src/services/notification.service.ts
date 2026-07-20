import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';

export class NotificationService {
  async sendNotification(userId: string, title: string, message: string, type: string, isMock = false) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          isRead: false,
          isMock,
          isArchived: false,
        }
      });

      logger.info({ userId, title }, 'Sent notification via Notification Bridge');

      eventBus.publish('notification.sent', notif);
      return notif;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to send notification via Notification Bridge');
      throw error;
    }
  }

  async getNotifications(userId: string, includeMock = true) {
    return prisma.notification.findMany({
      where: {
        userId,
        isArchived: false,
        ...(includeMock ? {} : { isMock: false })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}

export const notificationService = new NotificationService();
