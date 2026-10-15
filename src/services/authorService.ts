import api from './api';
import { Author } from '@/types';
import { mockAuthors } from './mockData';

let authorsData = [...mockAuthors];

export const authorService = {
  async getAuthors(): Promise<Author[]> {
    try {
      const response = await api.get<Author[]>('/authors');
      return response.data;
    } catch {
      return authorsData;
    }
  },

  async createAuthor(data: Partial<Author>): Promise<Author> {
    try {
      const response = await api.post<Author>('/authors', data);
      return response.data;
    } catch {
      const newAuthor: Author = {
        id: `auth-${Date.now()}`,
        name: data.name || 'Tác giả mới',
        nationality: data.nationality || 'Việt Nam',
        birthYear: data.birthYear,
        biography: data.biography || '',
        bookCount: 0,
      };
      authorsData.push(newAuthor);
      return newAuthor;
    }
  },

  async updateAuthor(id: string, data: Partial<Author>): Promise<Author> {
    try {
      const response = await api.put<Author>(`/authors/${id}`, data);
      return response.data;
    } catch {
      const idx = authorsData.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Không tìm thấy tác giả!');
      authorsData[idx] = { ...authorsData[idx], ...data };
      return authorsData[idx];
    }
  },

  async deleteAuthor(id: string): Promise<boolean> {
    try {
      await api.delete(`/authors/${id}`);
      return true;
    } catch {
      authorsData = authorsData.filter((a) => a.id !== id);
      return true;
    }
  },
};
