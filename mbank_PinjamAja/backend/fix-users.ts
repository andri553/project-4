import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Unlock CISO-007 (Sari Maharani - dev@pinjamaja.co.id)
  await prisma.user.update({
    where: { id: 'CISO-007' },
    data: { accountStatus: 'ACTIVE' }
  });
  console.log('[FIX] CISO-007 (Sari Maharani) → UNLOCKED');

  // 2. Reset risk score for CISO-001 (Dr. Rina Kusuma - admin) 
  await prisma.user.update({
    where: { id: 'CISO-001' },
    data: { riskScore: 0, riskLevel: 'LOW' }
  });
  console.log('[FIX] CISO-001 (Dr. Rina Kusuma) → Risk Score reset to 0 (LOW)');

  // 3. Reset risk score for CISO-002 (Budi Santoso - CISO)
  await prisma.user.update({
    where: { id: 'CISO-002' },
    data: { riskScore: 0, riskLevel: 'LOW' }
  });
  console.log('[FIX] CISO-002 (Budi Santoso, CISSP) → Risk Score reset to 0 (LOW)');

  // 4. Reset risk score for CISO-003 (Dewi Anggraeni - SOC Analyst)
  await prisma.user.update({
    where: { id: 'CISO-003' },
    data: { riskScore: 0, riskLevel: 'LOW' }
  });
  console.log('[FIX] CISO-003 (Dewi Anggraeni) → Risk Score reset to 0 (LOW)');

  // 5. Reset all failed PIN counters by resetting auth service state (handled on server restart)
  
  console.log('\n=== All user data reset successfully ===');
  
  // Verify
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, accountStatus: true, riskScore: true, riskLevel: true }
  });
  console.log('\nCurrent User States:');
  users.forEach(u => {
    console.log(`  ${u.id} | ${u.fullName} | ${u.email} | Status: ${u.accountStatus} | Risk: ${u.riskScore} (${u.riskLevel})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
