import { userRepository } from '../users/user.repository';

export class AuthorizationService {
  async hasPermission(userId: string, roleName: string, permissionName: string): Promise<boolean> {
    // Bypass for super admins
    const roleLower = roleName.toLowerCase();
    if (roleLower === 'administrator' || roleLower === 'super_admin') {
      return true;
    }

    const user = await userRepository.findById(userId);
    if (!user) return false;

    return user.role.rolePermissions.some(
      (rp) => rp.permission.name.toLowerCase() === permissionName.toLowerCase()
    );
  }
}

export const authorizationService = new AuthorizationService();
