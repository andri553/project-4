import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate a random number between min and max
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate a random date within the last X days
const randomDateInPast = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, days));
  date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));
  return date;
};

async function main() {
  console.log('Clearing existing data (except roles/system config)...');
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.user.deleteMany({
    where: { role: { name: 'USER' } }
  });

  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  if (!userRole) throw new Error("USER role not found");

  const passwordHash = await bcrypt.hash('password123', 10);
  const pinHash = await bcrypt.hash('123456', 10);

  // Define some realistic user profiles
  const userProfiles = [
    { name: 'Budi Santoso', phone: '081234567890', email: 'budi.santoso@example.com' },
    { name: 'Siti Rahayu', phone: '081298765432', email: 'siti.rahayu@example.com' },
    { name: 'Andi Wijaya', phone: '085612345678', email: 'andi.wijaya@example.com' },
    { name: 'Rina Melati', phone: '08119876543', email: 'rina.melati@example.com' },
    { name: 'Bambang Pamungkas', phone: '087812345678', email: 'bambang.p@example.com' },
    { name: 'Dewi Lestari', phone: '089612345678', email: 'dewi.lestari@example.com' },
  ];

  const purchaseMerchants = [
    'Tokopedia', 'Shopee', 'Gojek (GoFood)', 'Grab (GrabFood)', 'Indomaret', 
    'Alfamart', 'Starbucks', 'McDonalds', 'Cinema XXI', 'Kopi Kenangan'
  ];

  console.log(`Generating data for ${userProfiles.length} users...`);

  for (let i = 0; i < userProfiles.length; i++) {
    const profile = userProfiles[i];
    
    // Create User
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {},
      create: {
        fullName: profile.name,
        email: profile.email,
        phoneNumber: profile.phone,
        passwordHash,
        pinHash,
        roleId: userRole.id,
        kycStatus: 'APPROVED',
        accountStatus: 'ACTIVE',
        riskLevel: 'LOW'
      }
    });

    // We will simulate their transaction history (Purchases)
    const numTransactions = randomInt(15, 30); // 15 to 30 transactions per user
    let currentBalance = randomInt(3000000, 15000000); // Initial balance between 3M to 15M

    // Create an initial deposit/salary so balance makes sense
    await prisma.transaction.create({
      data: {
        accountId: `ACC-${user.id.substring(0, 6).toUpperCase()}`,
        userId: user.id,
        type: 'deposit',
        amount: currentBalance,
        balanceAfter: currentBalance,
        description: 'Gaji Bulanan / Saldo Awal',
        status: 'completed',
        createdAt: randomDateInPast(30) // sometime in the last 30 days
      }
    });

    const transactionsToInsert = [];
    
    // Generate purchases history
    for (let j = 0; j < numTransactions; j++) {
      // Random purchase amount between 20,000 and 1,000,000
      const amount = randomInt(2, 100) * 10000; 
      currentBalance -= amount;
      
      const merchant = purchaseMerchants[randomInt(0, purchaseMerchants.length - 1)];
      
      transactionsToInsert.push({
        accountId: `ACC-${user.id.substring(0, 6).toUpperCase()}`,
        userId: user.id,
        type: 'transfer_out', // or 'purchase'
        amount: amount,
        balanceAfter: currentBalance,
        description: `Pembelian di ${merchant}`,
        status: 'completed',
        recipientName: merchant,
        createdAt: randomDateInPast(29) // within the last 29 days so it's after the initial deposit
      });
    }

    // Sort transactions by date so the timeline is realistic (from oldest to newest)
    transactionsToInsert.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Fix balance cascade after sorting
    let rollingBalance = currentBalance + transactionsToInsert.reduce((sum, t) => sum + t.amount, 0);
    for (const t of transactionsToInsert) {
      rollingBalance -= t.amount;
      t.balanceAfter = rollingBalance;
    }

    // Insert all purchases
    for (const t of transactionsToInsert) {
      await prisma.transaction.create({ data: t });
    }

    console.log(`- Created user ${profile.name} with ${transactionsToInsert.length} purchase histories.`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
