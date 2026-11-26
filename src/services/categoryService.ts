import api, { handleApiErrorOrFallback } from './api';
import { Category } from '@/types';
import { mockCategories } from './mockData';

let categoriesData = [...mockCategories];

function mapCategory(raw: any): Category {
  return {
    id: String(raw.id),
    name: raw.name || '',
    code: raw.code || '',
    description: raw.description || '',
    bookCount: Number(raw.bookCount ?? raw.total_books ?? 0),
  };
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<any>('/categories');
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapCategory) : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return categoriesData;
    }
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    try {
      const response = await api.post<any>('/categories', {
        code: data.code,
        name: data.name,
        description: data.description,
      });
      return mapCategory(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
      const response = await api.put<any>(`/categories/${id}`, {
        code: data.code,
        name: data.name,
        description: data.description,
      });
      return mapCategory(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      categoriesData = categoriesData.filter((c) => c.id !== id);
      return true;
    }
  },
};
