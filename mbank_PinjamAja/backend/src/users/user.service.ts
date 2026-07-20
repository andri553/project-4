import { userRepository } from './user.repository';

export class UserService {
  async getUserById(id: string) {
    return userRepository.findById(id);
  }

  async getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async getUserByPhone(phone: string) {
    return userRepository.findByPhone(phone);
  }
}
export const userService = new UserService();
