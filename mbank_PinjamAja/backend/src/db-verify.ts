import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Verifying Database Records ---');

  // Query users
  const userCount = await prisma.user.count();
  console.log(`Total users in DB: ${userCount}`);

  // Query sessions
  const sessions = await prisma.session.findMany({
    include: {
      user: true
    }
  });
  console.log(`Active Sessions: ${sessions.length}`);
  sessions.forEach(s => {
    console.log(`- Session ID: ${s.id}, User: ${s.user.fullName} (${s.user.email}), IP: ${s.ipAddress}, OS: ${s.operatingSystem}`);
  });

  // Query audit logs
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(`Latest 5 Audit Logs:`);
  auditLogs.forEach(log => {
    console.log(`- [${log.createdAt.toISOString()}] Actor: ${log.actorId || 'SYSTEM'}, Action: ${log.action}, Result: ${log.result}, IP: ${log.ipAddress}`);
  });

  // Query security events
  const securityEvents = await prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(`Latest 5 Security Events:`);
  securityEvents.forEach(event => {
    console.log(`- [${event.createdAt.toISOString()}] User: ${event.userId || 'SYSTEM'}, Category: ${event.category}, Severity: ${event.severity}, Description: ${event.description}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
