import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting user deletion...');
  
  // Delete all users (cascade deletes sessions, loans, transactions, insurances, kycVerifications, devices, notifications)
  const deletedUsers = await prisma.user.deleteMany({});
  
  console.log(`Successfully deleted ${deletedUsers.count} users.`);
}

main()
  .catch((e) => {
    console.error('Error deleting users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
