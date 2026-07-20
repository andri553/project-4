import { prisma } from '../config/prisma';

export async function getDataSourceConfig() {
  const configs = await prisma.systemConfig.findMany();
  const liveEnabled = configs.find(c => c.key === 'liveEnabled')?.value !== 'false'; // default true
  const mockEnabled = configs.find(c => c.key === 'mockEnabled')?.value !== 'false'; // default true
  return { liveEnabled, mockEnabled };
}

export async function setDataSourceConfig(liveEnabled: boolean, mockEnabled: boolean) {
  await prisma.systemConfig.upsert({
    where: { key: 'liveEnabled' },
    update: { value: String(liveEnabled) },
    create: { key: 'liveEnabled', value: String(liveEnabled) }
  });
  await prisma.systemConfig.upsert({
    where: { key: 'mockEnabled' },
    update: { value: String(mockEnabled) },
    create: { key: 'mockEnabled', value: String(mockEnabled) }
  });
}

// Generates a Prisma where filter clause depending on active configurations
export async function getDataSourceFilter() {
  const { liveEnabled, mockEnabled } = await getDataSourceConfig();
  
  const filters: any = {
    isArchived: false
  };

  if (!liveEnabled && !mockEnabled) {
    // Both disabled: return empty
    filters.id = 'NONE';
  } else if (!liveEnabled) {
    // Only mock enabled
    filters.isMock = true;
  } else if (!mockEnabled) {
    // Only live enabled
    filters.isMock = false;
  }

  return filters;
}
