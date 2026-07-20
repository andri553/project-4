import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('--- Starting Unified PostgreSQL Database Seeding ---');

  // 1. Seed Roles
  const rolesData = [
    { name: 'Customer', description: 'Standard banking customer' },
    { name: 'Officer', description: 'General bank staff/support/verification' },
    { name: 'Compliance Officer', description: 'Legal and compliance officer' },
    { name: 'Fraud Analyst', description: 'Risk and fraud monitoring staff' },
    { name: 'Security Analyst', description: 'SOC analyst and security monitor' },
    { name: 'Administrator', description: 'System administrator with full bypass permissions' },
    { name: 'Chief Information Security Officer (CISO)', description: 'Information security executive' },
  ];

  const dbRoles: Record<string, string> = {}; // Name to ID mapping

  for (const role of rolesData) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    dbRoles[role.name] = created.id;
    console.log(`Upserted Role: ${role.name}`);
  }

  // 2. Seed Permissions
  const permissionsData = [
    { name: 'view_executive', description: 'View Executive Dashboard' },
    { name: 'view_risk', description: 'View Risk Management' },
    { name: 'view_compliance', description: 'View Compliance Management' },
    { name: 'view_governance', description: 'View Security Governance' },
    { name: 'view_roadmap', description: 'View Security Roadmap' },
    { name: 'view_vulnerability', description: 'View Vulnerability Management' },
    { name: 'view_incidents', description: 'View Incident Management' },
    { name: 'view_assets', description: 'View Asset Management' },
    { name: 'view_data-protection', description: 'View Data Protection' },
    { name: 'view_iam', description: 'View Identity & Access Management' },
    { name: 'view_awareness', description: 'View Security Awareness' },
    { name: 'view_audit', description: 'View Audit logs' },
    { name: 'view_reports', description: 'View security reports' },
    { name: 'view_kpi', description: 'View KPI engine' },
    { name: 'view_sdlc', description: 'View secure SDLC' },
    { name: 'view_settings', description: 'View and modify CISO system settings' },
    { name: 'view_kyc-queue', description: 'View KYC Verification Queue' },
  ];

  const dbPermissions: Record<string, string> = {};

  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description },
    });
    dbPermissions[perm.name] = created.id;
  }
  console.log(`Upserted ${permissionsData.length} permissions.`);

  // 3. Link Role & Permissions (RolePermission)
  const rolePermissionsMapping: Record<string, string[]> = {
    'Chief Information Security Officer (CISO)': [
      'view_executive', 'view_risk', 'view_compliance', 'view_governance', 'view_roadmap',
      'view_vulnerability', 'view_incidents', 'view_assets', 'view_data-protection', 'view_iam',
      'view_awareness', 'view_audit', 'view_reports', 'view_kpi', 'view_sdlc', 'view_kyc-queue'
    ],
    'Security Analyst': [
      'view_vulnerability', 'view_incidents', 'view_assets', 'view_reports'
    ],
    'Compliance Officer': [
      'view_risk', 'view_compliance', 'view_governance', 'view_data-protection',
      'view_audit', 'view_reports', 'view_kpi', 'view_kyc-queue'
    ],
    'Fraud Analyst': [
      'view_risk', 'view_governance', 'view_reports', 'view_kpi'
    ],
    'Officer': [
      'view_sdlc', 'view_reports'
    ]
  };

  // Clear existing role-permissions to avoid unique constraint duplicates
  await prisma.rolePermission.deleteMany();

  for (const [roleName, permNames] of Object.entries(rolePermissionsMapping)) {
    const roleId = dbRoles[roleName];
    if (!roleId) continue;

    for (const permName of permNames) {
      const permId = dbPermissions[permName];
      if (!permId) continue;

      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: permId,
        }
      });
    }
    console.log(`Linked permissions for Role: ${roleName}`);
  }

  // 4. Seed Users
  const userPasswordHash = await hashPassword('Customer123!');
  const staffPasswordHash = await hashPassword('CISO123!');

  const usersData = [
    // Mobile banking demo users
    {
      id: 'USR-001',
      fullName: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      phoneNumber: '+6281234567890',
      passwordHash: userPasswordHash,
      roleId: dbRoles['Customer'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: true,
      accountStatus: 'ACTIVE',
    },
    {
      id: 'USR-002',
      fullName: 'Siti Rahayu',
      email: 'siti.rahayu@yahoo.com',
      phoneNumber: '+6281298765432',
      passwordHash: userPasswordHash,
      roleId: dbRoles['Customer'],
      kycStatus: 'PENDING_REVIEW',
      mfaEnabled: false,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
    },
    {
      id: 'USR-003',
      fullName: 'Dewi Lestari',
      email: 'support@pinjamaja.id',
      phoneNumber: '+6281300000001',
      passwordHash: await hashPassword('Support123!'),
      roleId: dbRoles['Officer'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
    },
    {
      id: 'USR-004',
      fullName: 'Ahmad Hidayat',
      email: 'verifier@pinjamaja.id',
      phoneNumber: '+6281300000002',
      passwordHash: await hashPassword('Verifier123!'),
      roleId: dbRoles['Officer'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
    },
    {
      id: 'USR-005',
      fullName: 'Rina Wulandari',
      email: 'finance@pinjamaja.id',
      phoneNumber: '+6281300000003',
      passwordHash: await hashPassword('Finance123!'),
      roleId: dbRoles['Officer'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
    },
    {
      id: 'USR-006',
      fullName: 'Andi Pratama',
      email: 'andi.pratama@outlook.com',
      phoneNumber: '+6281355667788',
      passwordHash: userPasswordHash,
      roleId: dbRoles['Customer'],
      kycStatus: 'NOT_STARTED',
      mfaEnabled: false,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
    },
    // CISO portal administrative users
    {
      id: 'CISO-001',
      fullName: 'Dr. Rina Kusuma',
      email: 'admin@pinjamaja.co.id',
      phoneNumber: '+6281900000001',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Administrator'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'RK',
    },
    {
      id: 'CISO-002',
      fullName: 'Budi Santoso, CISSP',
      email: 'ciso@pinjamaja.co.id',
      phoneNumber: '+6281900000002',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Chief Information Security Officer (CISO)'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'BS',
    },
    {
      id: 'CISO-003',
      fullName: 'Dewi Anggraeni',
      email: 'soc@pinjamaja.co.id',
      phoneNumber: '+6281900000003',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Security Analyst'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'DA',
    },
    {
      id: 'CISO-004',
      fullName: 'Fajar Hidayat, CISA',
      email: 'compliance@pinjamaja.co.id',
      phoneNumber: '+6281900000004',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Compliance Officer'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'FH',
    },
    {
      id: 'CISO-005',
      fullName: 'Agus Prasetyo, CRISC',
      email: 'risk@pinjamaja.co.id',
      phoneNumber: '+6281900000005',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Fraud Analyst'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'AP',
    },
    {
      id: 'CISO-006',
      fullName: 'Hendra Wijaya',
      email: 'infra@pinjamaja.co.id',
      phoneNumber: '+6281900000006',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Security Analyst'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'HW',
    },
    {
      id: 'CISO-007',
      fullName: 'Sari Maharani',
      email: 'dev@pinjamaja.co.id',
      phoneNumber: '+6281900000007',
      passwordHash: staffPasswordHash,
      roleId: dbRoles['Officer'],
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      biometricEnabled: false,
      accountStatus: 'ACTIVE',
      avatarUrl: 'SM',
    },
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        passwordHash: user.passwordHash,
        roleId: user.roleId,
        kycStatus: user.kycStatus,
        mfaEnabled: user.mfaEnabled,
        biometricEnabled: user.biometricEnabled,
        accountStatus: user.accountStatus,
        avatarUrl: user.avatarUrl || null,
      },
      create: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        passwordHash: user.passwordHash,
        roleId: user.roleId,
        kycStatus: user.kycStatus,
        mfaEnabled: user.mfaEnabled,
        biometricEnabled: user.biometricEnabled,
        accountStatus: user.accountStatus,
        avatarUrl: user.avatarUrl || null,
      },
    });
    console.log(`Upserted User: ${user.fullName} (${user.email})`);
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
