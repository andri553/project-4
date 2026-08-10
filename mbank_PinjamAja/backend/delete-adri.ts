import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: 'adri' } },
        { fullName: { contains: 'adri' } }
      ]
    }
  });
  console.log('Successfully deleted adri user accounts:', deleted);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
