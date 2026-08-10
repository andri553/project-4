import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const txCount = await prisma.transaction.count();
  const todayTxCount = await prisma.transaction.count({
    where: {
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }
  });
  const mockTxCount = await prisma.transaction.count({
    where: { isMock: true }
  });
  
  console.log('Total Transactions:', txCount);
  console.log('Today Transactions:', todayTxCount);
  console.log('Mock Transactions:', mockTxCount);
  
  const users = await prisma.user.count();
  const incidents = await prisma.securityIncident.count();
  const events = await prisma.securityEvent.count();
  const auditLogs = await prisma.auditLog.count();
  
  console.log('Total Users:', users);
  console.log('Total Security Incidents:', incidents);
  console.log('Total Security Events:', events);
  console.log('Total Audit Logs:', auditLogs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
