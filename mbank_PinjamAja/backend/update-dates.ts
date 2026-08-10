import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRandomDateWithinLastDays(days: number) {
  const date = new Date();
  const offset = Math.random() * days * 24 * 60 * 60 * 1000;
  date.setTime(date.getTime() - offset);
  return date;
}

function getTodayDate() {
  const date = new Date();
  const offset = Math.random() * 8 * 60 * 60 * 1000; // random within last 8 hours
  date.setTime(date.getTime() - offset);
  return date;
}

async function main() {
  console.log('Updating database records to recent dates...');

  const transactions = await prisma.transaction.findMany();
  let txUpdated = 0;
  for (const tx of transactions) {
    const date = Math.random() < 0.6 ? getTodayDate() : getRandomDateWithinLastDays(7);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { createdAt: date }
    });
    txUpdated++;
  }
  console.log(`Updated ${txUpdated} transactions.`);

  const events = await prisma.securityEvent.findMany();
  let evtUpdated = 0;
  for (const evt of events) {
    const date = Math.random() < 0.7 ? getTodayDate() : getRandomDateWithinLastDays(7);
    await prisma.securityEvent.update({
      where: { id: evt.id },
      data: { createdAt: date }
    });
    evtUpdated++;
  }
  console.log(`Updated ${evtUpdated} security events.`);

  const incidents = await prisma.securityIncident.findMany();
  let incUpdated = 0;
  for (const inc of incidents) {
    const date = Math.random() < 0.7 ? getTodayDate() : getRandomDateWithinLastDays(7);
    let resolvedDate = null;
    if (inc.status === 'RESOLVED') {
       resolvedDate = new Date(date.getTime() + (Math.random() * 4 * 60 * 60 * 1000));
    }
    await prisma.securityIncident.update({
      where: { id: inc.id },
      data: { createdAt: date, resolvedAt: resolvedDate }
    });
    incUpdated++;
  }
  console.log(`Updated ${incUpdated} security incidents.`);
  
  const kycs = await prisma.kYCVerification.findMany();
  let kycUpdated = 0;
  for (const kyc of kycs) {
    const date = Math.random() < 0.7 ? getTodayDate() : getRandomDateWithinLastDays(7);
    await prisma.kYCVerification.update({
      where: { id: kyc.id },
      data: { submittedAt: date, updatedAt: date }
    });
    kycUpdated++;
  }
  console.log(`Updated ${kycUpdated} KYC verifications.`);
  
  const history = await prisma.kYCHistory.findMany();
  for (const h of history) {
    const date = Math.random() < 0.7 ? getTodayDate() : getRandomDateWithinLastDays(7);
    await prisma.kYCHistory.update({
      where: { id: h.id },
      data: { timestamp: date }
    });
  }
  console.log(`Updated KYC History.`);

  const audits = await prisma.auditLog.findMany();
  let auditUpdated = 0;
  for (const audit of audits) {
     const date = Math.random() < 0.5 ? getTodayDate() : getRandomDateWithinLastDays(7);
     await prisma.auditLog.update({
       where: { id: audit.id },
       data: { createdAt: date }
     });
     auditUpdated++;
  }
  console.log(`Updated ${auditUpdated} audit logs.`);

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
