import api from './api';
import { LoginResponse, User } from '@/types';
import { mockUsers, mockReaderCards } from './mockData';

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', { username, password });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local mock auth:', err);
    }

    // Mock login fallback
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

  async register(userData: Partial<User> & { password?: string }): Promise<User> {
    try {
      const response = await api.post<User>('/auth/register', userData);
      return response.data;
    } catch (err) {
      console.warn('Backend API unavailable, using local mock register:', err);
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username || 'newuser',
        fullName: userData.fullName || 'Người Dùng Mới',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'BORROWER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return newUser;
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/profile');
      return response.data;
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) {
        return JSON.parse(stored);
      }
      throw new Error('Chưa đăng nhập');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('readerCard');
  },
};
