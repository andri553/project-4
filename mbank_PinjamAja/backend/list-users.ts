import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      accountStatus: true,
      kycStatus: true,
      riskScore: true,
      riskLevel: true,
      isMock: true,
      isArchived: true,
      role: { select: { name: true } },
      lastLoginAt: true,
    }
  });

  console.log('=== ALL USERS IN DATABASE ===');
  console.log(JSON.stringify(users, null, 2));
  console.log(`\nTotal: ${users.length} users`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
