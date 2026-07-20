import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { securityService } from '../security/security.service';

export class DeviceService {
  async validateDevice(userId: string, context: {
    deviceId?: string;
    deviceFingerprint?: string;
    os?: string;
    browser?: string;
    ipAddress?: string;
  }) {
    // Generate a stable fingerprint if not provided
    const deviceId = context.deviceId || 'DEV-' + Math.floor(1000 + Math.random() * 9000);
    const fingerprint = context.deviceFingerprint || Buffer.from(`${context.os}-${context.browser}`).toString('base64').substring(0, 16);
    const os = context.os || 'unknown';
    const browser = context.browser || 'unknown';
    const location = this.simulateLocation(context.ipAddress || '127.0.0.1');

    // Find device in DB
    let device = await prisma.device.findFirst({
      where: {
        userId,
        deviceId
      }
    });

    if (device) {
      // Update last seen
      device = await prisma.device.update({
        where: { id: device.id },
        data: {
          lastSeen: new Date(),
          location,
          os,
          browser,
          fingerprint
        }
      });
      return { isTrusted: device.isTrusted, device };
    } else {
      // Register new unrecognized device
      const deviceCount = await prisma.device.count({ where: { userId } });
      const isTrusted = deviceCount === 0; // First device is auto-trusted

      device = await prisma.device.create({
        data: {
          userId,
          deviceId,
          fingerprint,
          os,
          browser,
          isTrusted,
          location,
          firstSeen: new Date(),
          lastSeen: new Date()
        }
      });

      // Publish new device detected event (for risk evaluation)
      eventBus.publish('device.new_detected', {
        userId,
        deviceId: device.id,
        deviceName: `${os} (${browser})`,
        isTrusted,
        location,
        fingerprint
      });

      await securityService.log({
        userId,
        category: 'Device Security',
        sourceModule: 'device_service',
        severity: isTrusted ? 'Low' : 'Medium',
        riskScore: isTrusted ? 0 : 20, // Risk +20 for new untrusted devices
        description: `New device registered: ${os} (${browser}) at ${location}. Trusted: ${isTrusted}`,
        status: isTrusted ? 'RESOLVED' : 'OPEN'
      });

      return { isTrusted, device };
    }
  }

  async trustDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { userId, deviceId }
    });

    if (!device) throw new Error('Device not found');

    const updated = await prisma.device.update({
      where: { id: device.id },
      data: { isTrusted: true }
    });

    await securityService.log({
      userId,
      category: 'Device Security',
      sourceModule: 'device_service',
      severity: 'Low',
      riskScore: 0,
      description: `Device marked as trusted: ${device.os} (${device.browser})`,
      status: 'RESOLVED'
    });

    eventBus.publish('device.trusted', {
      userId,
      deviceId: device.id
    });

    return updated;
  }

  async removeDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { userId, deviceId }
    });

    if (!device) throw new Error('Device not found');

    await prisma.device.delete({
      where: { id: device.id }
    });

    await securityService.log({
      userId,
      category: 'Device Security',
      sourceModule: 'device_service',
      severity: 'Low',
      riskScore: 0,
      description: `Device removed: ${device.os} (${device.browser})`,
      status: 'RESOLVED'
    });
  }

  private simulateLocation(ip: string): string {
    if (ip === '::1' || ip === '127.0.0.1') return 'Jakarta, Indonesia (Localhost)';
    const locations = [
      'Jakarta, Indonesia',
      'Surabaya, Indonesia',
      'Bandung, Indonesia',
      'Medan, Indonesia',
      'Singapore',
      'Tokyo, Japan',
      'Sydney, Australia',
      'London, UK',
      'California, USA'
    ];
    const parts = ip.split('.');
    const lastPart = parts[parts.length - 1];
    const index = parseInt(lastPart) % locations.length;
    return locations[isNaN(index) ? 0 : index];
  }
}

export const deviceService = new DeviceService();
