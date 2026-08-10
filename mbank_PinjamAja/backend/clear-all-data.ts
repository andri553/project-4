import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning All User Data & Operational History ---');

  // Delete all operational logs & records
  const deletedLogs = await prisma.auditLog.deleteMany({});
  console.log(`Deleted AuditLogs: ${deletedLogs.count}`);

  const deletedEvents = await prisma.securityEvent.deleteMany({});
  console.log(`Deleted SecurityEvents: ${deletedEvents.count}`);

  const deletedIncidents = await prisma.securityIncident.deleteMany({});
  console.log(`Deleted SecurityIncidents: ${deletedIncidents.count}`);

  const deletedTx = await prisma.transaction.deleteMany({});
  console.log(`Deleted Transactions: ${deletedTx.count}`);

  const deletedLoans = await prisma.loan.deleteMany({});
  console.log(`Deleted Loans: ${deletedLoans.count}`);

  const deletedInsurances = await prisma.insurance.deleteMany({});
  console.log(`Deleted Insurances: ${deletedInsurances.count}`);

  const deletedKycHist = await prisma.kYCHistory.deleteMany({});
  console.log(`Deleted KYCHistory: ${deletedKycHist.count}`);

  const deletedKycVerif = await prisma.kYCVerification.deleteMany({});
  console.log(`Deleted KYCVerifications: ${deletedKycVerif.count}`);

  const deletedSessions = await prisma.session.deleteMany({});
  console.log(`Deleted Sessions: ${deletedSessions.count}`);

  const deletedDevices = await prisma.device.deleteMany({});
  console.log(`Deleted Devices: ${deletedDevices.count}`);

  const deletedNotifs = await prisma.notification.deleteMany({});
  console.log(`Deleted Notifications: ${deletedNotifs.count}`);

  // Delete non-admin customer users (keep admin/staff logins so login system works)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: [
          'admin@pinjamaja.co.id',
          'ciso@pinjamaja.co.id',
          'soc@pinjamaja.co.id',
          'compliance@pinjamaja.co.id',
          'risk@pinjamaja.co.id',
          'infra@pinjamaja.co.id',
          'dev@pinjamaja.co.id'
        ]
      }
    }
  });
  console.log(`Deleted Customer Users: ${deletedUsers.count}`);

  // Update SystemConfig to set mockEnabled = false, liveEnabled = true
  await prisma.systemConfig.upsert({
    where: { key: 'datasource_config' },
    update: { value: JSON.stringify({ liveEnabled: true, mockEnabled: false }) },
    create: { key: 'datasource_config', value: JSON.stringify({ liveEnabled: true, mockEnabled: false }) }
  });
  console.log('SystemConfig updated: mockEnabled = false, liveEnabled = true');

  console.log('--- Cleanup Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
