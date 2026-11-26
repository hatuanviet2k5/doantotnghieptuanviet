import api, { handleApiErrorOrFallback } from './api';
import { Author } from '@/types';
import { mockAuthors } from './mockData';

let authorsData = [...mockAuthors];

function mapAuthor(raw: any): Author {
  return {
    id: String(raw.id),
    name: raw.name || '',
    biography: raw.biography || raw.bio || '',
    birthYear: raw.birthYear,
    nationality: raw.nationality || 'Việt Nam',
    bookCount: Number(raw.bookCount ?? raw.total_books ?? 0),
  };
}

export const authorService = {
  async getAuthors(): Promise<Author[]> {
    try {
      const response = await api.get<any>('/authors');
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapAuthor) : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return authorsData;
    }
  },

  async createAuthor(data: Partial<Author>): Promise<Author> {
    try {
      const response = await api.post<any>('/authors', {
        name: data.name,
        bio: data.biography,
      });
      return mapAuthor(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
      const response = await api.put<any>(`/authors/${id}`, {
        code: `TG-${id}`,
        name: data.name,
        bio: data.biography,
      });
      return mapAuthor(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      authorsData = authorsData.filter((a) => a.id !== id);
      return true;
    }
  },
};
