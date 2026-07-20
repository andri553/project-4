import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export class RoleRepository {
  async findByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { id },
    });
  }
}
export const roleRepository = new RoleRepository();
