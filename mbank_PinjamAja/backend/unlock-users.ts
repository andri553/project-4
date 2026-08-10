import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockAll() {
  const updated = await prisma.user.updateMany({
    where: { accountStatus: 'LOCKED' },
    data: { accountStatus: 'ACTIVE' }
  });
  console.log(`Unlocked ${updated.count} locked users.`);
}

unlockAll().catch(console.error).finally(() => prisma.$disconnect());
