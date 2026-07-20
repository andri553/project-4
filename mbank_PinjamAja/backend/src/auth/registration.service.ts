import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';
import { securityService } from '../security/security.service';

export class RegistrationService {
  async registerProfile(data: { fullName: string; email: string; phoneNumber: string }) {
    // Check if phone or email already registered
    const existingPhone = await prisma.user.findUnique({ where: { phoneNumber: data.phoneNumber } });
    if (existingPhone) throw new Error('Nomor telepon sudah terdaftar');

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new Error('Email sudah terdaftar');

    // Find customer role
    const role = await prisma.role.findFirst({
      where: { name: { equals: 'Customer', mode: 'insensitive' } }
    });
    if (!role) throw new Error('Role Customer tidak ditemukan');

    // Create user
    // Generate a default passwordHash because it is required in Prisma schema
    const defaultPasswordHash = await hashPassword('Customer123!');

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        passwordHash: defaultPasswordHash,
        roleId: role.id,
        accountStatus: 'ACTIVE',
        kycStatus: 'NOT_STARTED'
      }
    });

    await securityService.log({
      userId: user.id,
      category: 'Registration',
      sourceModule: 'registration_service',
      severity: 'Low',
      riskScore: 0,
      description: `New user registration profile created: ${data.phoneNumber}`,
      status: 'RESOLVED'
    });

    return user;
  }

  async setupPIN(userId: string, pin: string) {
    // Hash PIN using standard hashing
    const pinHash = await hashPassword(pin);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pinHash }
    });

    await securityService.log({
      userId,
      category: 'Registration',
      sourceModule: 'registration_service',
      severity: 'Low',
      riskScore: 0,
      description: 'PIN setup completed successfully',
      status: 'RESOLVED'
    });

    return user;
  }
}

export const registrationService = new RegistrationService();
