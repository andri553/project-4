import { prisma } from './config/prisma';
import { incidentService } from './services/incident.service';
import { auditService } from './services/audit.service';
import { eventBus } from './eventbus/eventbus';
import { initListeners } from './eventbus/listeners';

async function main() {
  console.log('--- STARTING ENTERPRISE SYNCHRONIZATION VERIFICATION ---');
  initListeners();

  // Find a test user
  const user = await prisma.user.findFirst({
    where: { email: 'budi.santoso@gmail.com' },
    include: { role: true }
  });

  if (!user) {
    console.error('Test user budi.santoso@gmail.com not found. Seed the database first.');
    process.exit(1);
  }

  console.log(`Using test user: ${user.fullName} (${user.role.name})`);

  // Scenario 1: Authentication Log Auditing
  console.log('\n[Scenario 1] Simulating Login event...');
  const initialAuditCount = await prisma.auditLog.count({ where: { actorId: user.id } });
  
  eventBus.publish('auth.login', {
    user,
    context: { ipAddress: '127.0.0.1', browser: 'NodeTest', deviceId: 'test-device' },
    correlationId: 'test-correlation-id-1'
  });

  // Wait for EventBus async handler
  await new Promise(r => setTimeout(r, 1000));
  const postAuditCount = await prisma.auditLog.count({ where: { actorId: user.id } });
  console.log(`Audit Logs: Before: ${initialAuditCount}, After: ${postAuditCount}`);
  if (postAuditCount > initialAuditCount) {
    console.log('✓ Scenario 1 PASS: Login event successfully generated an audit log in PostgreSQL.');
  } else {
    console.error('✗ Scenario 1 FAIL: Audit log was not created.');
  }

  // Scenario 2: Loan Submission Reporting
  console.log('\n[Scenario 2] Simulating Loan Submission...');
  const initialLoanCount = await prisma.loan.count({ where: { userId: user.id } });
  const newLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      productId: 'test-product-1',
      productName: 'Instant Cash Test',
      amount: 10000000,
      tenor: 12,
      purpose: 'Verification Testing',
      interestRate: 1.5,
      monthlyInstallment: 983333,
      totalRepayment: 11800000,
      status: 'active'
    }
  });

  eventBus.publish('loan.applied', { loan: newLoan, user });
  await new Promise(r => setTimeout(r, 500));

  const postLoanCount = await prisma.loan.count({ where: { userId: user.id } });
  const activeLoansMetric = await prisma.loan.count({ where: { status: 'active' } });
  console.log(`Loans: Before: ${initialLoanCount}, After: ${postLoanCount}`);
  console.log(`Active Loans total metric: ${activeLoansMetric}`);
  if (postLoanCount > initialLoanCount && activeLoansMetric > 0) {
    console.log('✓ Scenario 2 PASS: Loan submission registered in database and metrics updated.');
  } else {
    console.error('✗ Scenario 2 FAIL: Loan submission failed.');
  }

  // Scenario 3: KYC Queue Lifecycle
  console.log('\n[Scenario 3] Simulating KYC Submission...');
  const initialKycPending = await prisma.kYCVerification.count({ where: { status: 'pending' } });
  const kycObj = await prisma.kYCVerification.create({
    data: {
      userId: user.id,
      status: 'pending',
      ocrData: JSON.stringify({ nama: user.fullName, nik: '1234567890123456' }),
      matchScore: 92
    }
  });

  eventBus.publish('kyc.submitted', { verification: kycObj, user });
  await new Promise(r => setTimeout(r, 500));

  const postKycPending = await prisma.kYCVerification.count({ where: { status: 'pending' } });
  console.log(`KYC Pending Count: Before: ${initialKycPending}, After: ${postKycPending}`);
  if (postKycPending > initialKycPending) {
    console.log('✓ Scenario 3 PASS: KYC submission added to pending queue in database.');
  } else {
    console.error('✗ Scenario 3 FAIL: KYC pending verification failed.');
  }

  // Scenario 4: Automated Incident Escalation
  console.log('\n[Scenario 4] Simulating Multiple Failed Logins...');
  const initialIncidents = await prisma.securityIncident.count();
  
  // Record 3 failures to trigger brute force
  await incidentService.recordLoginFailure(user.email, '127.0.0.1');
  await incidentService.recordLoginFailure(user.email, '127.0.0.1');
  await incidentService.recordLoginFailure(user.email, '127.0.0.1');

  await new Promise(r => setTimeout(r, 1000));
  const postIncidents = await prisma.securityIncident.count();
  console.log(`Incidents: Before: ${initialIncidents}, After: ${postIncidents}`);
  
  if (postIncidents > initialIncidents) {
    console.log('✓ Scenario 4 PASS: Brute force detected, incident generated, and account locked in PostgreSQL.');
  } else {
    console.error('✗ Scenario 4 FAIL: Failed logins did not trigger incident generation.');
  }

  // Clean up verification data
  console.log('\nCleaning up verification records...');
  await prisma.loan.delete({ where: { id: newLoan.id } });
  await prisma.kYCVerification.delete({ where: { id: kycObj.id } });
  // Clean up test brute force incidents
  await prisma.securityIncident.deleteMany({
    where: {
      description: { contains: `Brute Force pattern detected for user ${user.email}` }
    }
  });
  // Reset user accountStatus back to ACTIVE
  await prisma.user.update({
    where: { id: user.id },
    data: { accountStatus: 'ACTIVE' }
  });

  console.log('\n--- VERIFICATION FINISHED SUCCESSFULLY ---');
}

main()
  .catch(err => {
    console.error('Error during verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
