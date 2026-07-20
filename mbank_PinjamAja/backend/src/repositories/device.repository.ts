import { prisma } from '../config/prisma';

export class DeviceRepository {
  async findByUserId(userId: string) {
    return prisma.device.findMany({
      where: {
        userId,
        isArchived: false
      },
      orderBy: { lastSeen: 'desc' }
    });
  }

  async findSpecificDevice(userId: string, deviceId: string) {
    return prisma.device.findFirst({
      where: {
        userId,
        deviceId,
        isArchived: false
      }
    });
  }
}

export const deviceRepository = new DeviceRepository();
