import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { notificationService } from './notification.service';

export class SavingsService {
  async deposit(userId: string, accountId: string, amount: number, description: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      // Create transaction
      const tx = await prisma.transaction.create({
        data: {
          userId,
          accountId,
          type: 'deposit',
          amount,
          balanceAfter: 0, // In real DB we would compute balance, but for mock/sim we can just write it
          description,
          status: 'completed',
          isMock: user.isMock,
          isArchived: user.isArchived
        }
      });

      logger.info({ userId, amount }, 'Deposit completed');

      eventBus.publish('savings.deposit', { tx, user });

      await notificationService.sendNotification(
        userId,
        'Setoran Berhasil',
        `Setoran sebesar Rp ${amount.toLocaleString('id-ID')} telah ditambahkan ke rekening Anda.`,
        'transaction',
        user.isMock
      );

      return tx;
    } catch (error) {
      logger.error({ error, userId }, 'Failed deposit');
      throw error;
    }
  }

  async withdraw(userId: string, accountId: string, amount: number, description: string, isQris = false) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const type = isQris ? 'withdrawal_qris' : 'withdrawal';

      const tx = await prisma.transaction.create({
        data: {
          userId,
          accountId,
          type,
          amount,
          balanceAfter: 0,
          description,
          status: 'completed',
          isMock: user.isMock,
          isArchived: user.isArchived
        }
      });

      logger.info({ userId, amount }, 'Withdrawal completed');

      eventBus.publish('savings.withdrawal', { tx, user, isQris });

      await notificationService.sendNotification(
        userId,
        isQris ? 'Pembayaran QRIS Berhasil' : 'Tarik Tunai Berhasil',
        `Pembayaran/penarikan sebesar Rp ${amount.toLocaleString('id-ID')} berhasil.`,
        'transaction',
        user.isMock
      );

      return tx;
    } catch (error) {
      logger.error({ error, userId }, 'Failed withdrawal');
      throw error;
    }
  }

  async transfer(userId: string, accountId: string, amount: number, data: {
    recipientName: string;
    recipientAccount: string;
    recipientBank: string;
  }) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const tx = await prisma.transaction.create({
        data: {
          userId,
          accountId,
          type: 'transfer_out',
          amount,
          balanceAfter: 0,
          description: `Transfer ke ${data.recipientBank} (${data.recipientName})`,
          recipientName: data.recipientName,
          recipientAccount: data.recipientAccount,
          recipientBank: data.recipientBank,
          status: 'completed',
          isMock: user.isMock,
          isArchived: user.isArchived
        }
      });

      logger.info({ userId, amount }, 'Transfer completed');

      eventBus.publish('savings.transfer', { tx, user });

      await notificationService.sendNotification(
        userId,
        'Transfer Berhasil',
        `Transfer Rp ${amount.toLocaleString('id-ID')} ke ${data.recipientBank} (${data.recipientName}) berhasil.`,
        'transaction',
        user.isMock
      );

      return tx;
    } catch (error) {
      logger.error({ error, userId }, 'Failed transfer');
      throw error;
    }
  }

  async getTransactions(userId: string, includeMock = true) {
    return prisma.transaction.findMany({
      where: {
        userId,
        isArchived: false,
        ...(includeMock ? {} : { isMock: false })
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const savingsService = new SavingsService();
