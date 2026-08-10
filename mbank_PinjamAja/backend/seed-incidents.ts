import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedIncidents() {
  const users = await prisma.user.findMany({ take: 5 });
  const user1 = users[0];
  const user2 = users[1] || users[0];
  const user3 = users[2] || users[0];

  const sampleIncidents = [
    {
      userId: user1?.id || null,
      title: 'KTP & Face Biometric Matching Anomaly',
      description: `Unstable face-to-KTP biometric match detected for ${user1?.email || 'budi.santoso@example.com'}. Match score 58% (Threshold: 80%). Requires manual CISO review.`,
      severity: 'HIGH',
      status: 'OPEN',
      isMock: false,
      isArchived: false,
    },
    {
      userId: user2?.id || null,
      title: 'Multiple PIN Verification Failures',
      description: `User ${user2?.email || 'siti.rahayu@example.com'} failed PIN verification 3 times within 2 minutes. Flagged for security audit.`,
      severity: 'HIGH',
      status: 'OPEN',
      isMock: false,
      isArchived: false,
    },
    {
      userId: user3?.id || null,
      title: 'Brute Force PIN Attack Detected',
      description: `Account locked for user ${user3?.email || 'andi.wijaya@example.com'} after 5 consecutive PIN failures from IP 192.168.1.45.`,
      severity: 'CRITICAL',
      status: 'OPEN',
      isMock: false,
      isArchived: false,
    }
  ];

  for (const inc of sampleIncidents) {
    const existing = await prisma.securityIncident.findFirst({
      where: { title: inc.title }
    });
    if (!existing) {
      await prisma.securityIncident.create({ data: inc });
      console.log(`Created incident: ${inc.title}`);
    }
  }

  const totalIncidents = await prisma.securityIncident.count({ where: { isArchived: false } });
  console.log(`Total active security incidents in database: ${totalIncidents}`);
}

seedIncidents().catch(console.error).finally(() => prisma.$disconnect());
