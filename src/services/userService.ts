import api, { handleApiErrorOrFallback } from './api';
import { Role, User, UserStatus } from '@/types';
import { mockUsers } from './mockData';

let usersData = [...mockUsers];

function mapUser(raw: any): User {
  return {
    id: String(raw.id),
    username: raw.username,
    fullName: raw.fullName || raw.full_name || '',
    email: raw.email || '',
    phone: raw.phone || '',
    role: (raw.role || raw.role_name || 'BORROWER') as Role,
    status: (raw.status || 'ACTIVE') as UserStatus,
    readerCardId: raw.reader_card_id ? String(raw.reader_card_id) : raw.readerCardId,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get<any>('/users', { params: { limit: 100 } });
      const payload = response.data?.data;
      const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      return items.map(mapUser);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return usersData;
    }
  },

  async createUser(data: Partial<User> & { password?: string }): Promise<User> {
    try {
      const response = await api.post<any>('/users', {
        username: data.username,
        password: data.password,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        role_name: data.role || 'BORROWER',
      });
      const payload = response.data?.data || response.data;
      return mapUser(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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

  async updateUser(id: string, data: Partial<User> & { password?: string }): Promise<User> {
    try {
      const roleMap: Record<Role, number> = { ADMIN: 1, LIBRARIAN: 2, BORROWER: 3 };
      await api.put<any>(`/users/${id}`, {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        role_id: data.role ? roleMap[data.role] : undefined,
        password: data.password || undefined,
      });
      const res = await api.get<any>(`/users/${id}`);
      return mapUser(res.data?.data || res.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const idx = usersData.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error('Không tìm thấy người dùng!');
      usersData[idx] = { ...usersData[idx], ...data, updatedAt: new Date().toISOString() };
      return usersData[idx];
    }
  },

  async toggleUserStatus(id: string, currentStatus?: UserStatus): Promise<User> {
    try {
      const nextStatus: UserStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
      const response = await api.put<any>(`/users/${id}/status`, { status: nextStatus });
      const res = await api.get<any>(`/users/${id}`);
      return mapUser(res.data?.data || response.data?.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const user = usersData.find((u) => u.id === id);
      if (!user) throw new Error('Không tìm thấy người dùng!');
      user.status = user.status === 'ACTIVE' ? ('LOCKED' as UserStatus) : ('ACTIVE' as UserStatus);
      return user;
    }
  },
};
