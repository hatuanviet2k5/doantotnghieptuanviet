import api, { handleApiErrorOrFallback } from './api';
import { LoginResponse, ReaderCard, User } from '@/types';
import { mockUsers, mockReaderCards } from './mockData';

function mapUser(raw: any): User {
  return {
    id: String(raw.id),
    username: raw.username,
    fullName: raw.fullName || raw.full_name || '',
    email: raw.email || '',
    phone: raw.phone || '',
    role: raw.role || raw.role_name || 'BORROWER',
    status: raw.status || 'ACTIVE',
    readerCardId: raw.reader_card?.id ? String(raw.reader_card.id) : raw.readerCardId,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}

function mapReaderCard(raw: any, userId: string, userFullName?: string): ReaderCard | undefined {
  if (!raw) return undefined;
  return {
    id: String(raw.id),
    cardNumber: raw.cardNumber || raw.card_number,
    userId,
    userFullName: userFullName || raw.userFullName || raw.full_name,
    issueDate: raw.issueDate || raw.issued_date || '',
    expiryDate: raw.expiryDate || raw.expire_date || '',
    status: raw.status || 'ACTIVE',
    maxBorrowLimit: raw.maxBorrowLimit ?? raw.max_borrow ?? 5,
    currentBorrowCount: raw.currentBorrowCount ?? raw.currently_borrowing_count ?? 0,
  };
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<any>('/auth/login', { username, password });
      const payload = response.data?.data || response.data;
      if (payload && payload.token) {
        const mappedUser = mapUser(payload.user);
        const mappedCard = mapReaderCard(payload.user?.reader_card, mappedUser.id, mappedUser.fullName);
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        if (mappedCard) {
          localStorage.setItem('readerCard', JSON.stringify(mappedCard));
        } else {
          localStorage.removeItem('readerCard');
        }
        return {
          token: payload.token,
          user: mappedUser,
          readerCard: mappedCard,
        };
      }
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      console.warn('Backend API unavailable, using local mock auth:', err);
    }

    // Mock login fallback (only when backend is offline)
    const user = mockUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (!user) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }

    if (user.status === 'LOCKED') {
      throw new Error('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên!');
    }

    const readerCard = mockReaderCards.find((c) => c.userId === user.id);
    const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
    const result: LoginResponse = {
      token: mockToken,
      user,
      readerCard,
    };

    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(user));
    if (readerCard) {
      localStorage.setItem('readerCard', JSON.stringify(readerCard));
    }

    return result;
  },

  async register(userData: {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    try {
      const response = await api.post<any>('/auth/register', {
        username: userData.username,
        password: userData.password,
        full_name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
      });
      const payload = response.data?.data || response.data;
      return mapUser(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      console.warn('Backend API unavailable, using local mock register:', err);
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username || 'newuser',
        fullName: userData.fullName || 'Người Dùng Mới',
        email: userData.email || '',
        phone: userData.phone || '',
        role: 'BORROWER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return newUser;
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get<any>('/auth/profile');
      const payload = response.data?.data || response.data;
      const mapped = mapUser(payload);
      localStorage.setItem('user', JSON.stringify(mapped));
      return mapped;
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const stored = localStorage.getItem('user');
      if (stored) {
        return JSON.parse(stored);
      }
      throw new Error('Chưa đăng nhập');
    }
  },

  async updateProfile(data: { fullName: string; email?: string; phone?: string }): Promise<User> {
    try {
      const response = await api.put<any>('/auth/profile', {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      const payload = response.data?.data || response.data;
      const stored = localStorage.getItem('user');
      const current = stored ? JSON.parse(stored) : {};
      const updated: User = {
        ...current,
        fullName: payload.full_name || data.fullName,
        email: payload.email ?? data.email ?? '',
        phone: payload.phone ?? data.phone ?? '',
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const stored = localStorage.getItem('user');
      if (!stored) throw new Error('Không tìm thấy thông tin người dùng');
      const current = JSON.parse(stored);
      const updated = { ...current, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      throw new Error('Không thể kết nối máy chủ để đổi mật khẩu');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('readerCard');
  },
};
