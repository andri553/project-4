import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const events = await prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  events.forEach(e => {
    console.log(`[${e.createdAt.toISOString()}] Category: ${e.category}, Severity: ${e.severity}, Description: ${e.description}`);
  });
}
main().finally(() => prisma.$disconnect());
