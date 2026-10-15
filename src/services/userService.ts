import api from './api';
import { User, UserStatus } from '@/types';
import { mockUsers } from './mockData';

let usersData = [...mockUsers];

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get<User[]>('/users');
      return response.data;
    } catch {
      return usersData;
    }
  },

  async createUser(data: Partial<User> & { password?: string }): Promise<User> {
    try {
      const response = await api.post<User>('/users', data);
      return response.data;
    } catch {
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: data.username || `user_${Date.now().toString().slice(-4)}`,
        fullName: data.fullName || 'Người dùng mới',
        email: data.email || 'user@example.com',
        phone: data.phone || '',
        role: data.role || 'BORROWER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      usersData.unshift(newUser);
      return newUser;
    }
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await api.put<User>(`/users/${id}`, data);
      return response.data;
    } catch {
      const idx = usersData.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error('Không tìm thấy người dùng!');
      usersData[idx] = { ...usersData[idx], ...data, updatedAt: new Date().toISOString() };
      return usersData[idx];
    }
  },

  async toggleUserStatus(id: string): Promise<User> {
    try {
      const response = await api.patch<User>(`/users/${id}/toggle-status`);
      return response.data;
    } catch {
      const user = usersData.find((u) => u.id === id);
      if (!user) throw new Error('Không tìm thấy người dùng!');
      user.status = user.status === 'ACTIVE' ? ('LOCKED' as UserStatus) : ('ACTIVE' as UserStatus);
      return user;
    }
  },
};
