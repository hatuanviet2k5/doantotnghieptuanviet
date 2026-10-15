import api from './api';
import { Category } from '@/types';
import { mockCategories } from './mockData';

let categoriesData = [...mockCategories];

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>('/categories');
      return response.data;
    } catch {
      return categoriesData;
    }
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    try {
      const response = await api.post<Category>('/categories', data);
      return response.data;
    } catch {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: data.name || 'Thể loại mới',
        code: data.code || `CAT-${Date.now().toString().slice(-4)}`,
        description: data.description || '',
        bookCount: 0,
      };
      categoriesData.push(newCat);
      return newCat;
    }
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    try {
      const response = await api.put<Category>(`/categories/${id}`, data);
      return response.data;
    } catch {
      const idx = categoriesData.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Không tìm thấy danh mục!');
      categoriesData[idx] = { ...categoriesData[idx], ...data };
      return categoriesData[idx];
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await api.delete(`/categories/${id}`);
      return true;
    } catch {
      categoriesData = categoriesData.filter((c) => c.id !== id);
      return true;
    }
  },
};
