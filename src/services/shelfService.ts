import api from './api';
import { Shelf, BookCopy, BookCopyStatus } from '@/types';
import { mockShelves, mockCopies } from './mockData';

let shelvesData = [...mockShelves];
let copiesData = [...mockCopies];

export const shelfService = {
  async getShelves(): Promise<Shelf[]> {
    try {
      const response = await api.get<Shelf[]>('/shelves');
      return response.data;
    } catch {
      return shelvesData.map((s) => {
        const copies = copiesData.filter((c) => c.shelfId === s.id);
        return {
          ...s,
          currentUsage: copies.length,
        };
      });
    }
  },

  async getShelfById(id: string): Promise<Shelf> {
    try {
      const response = await api.get<Shelf>(`/shelves/${id}`);
      return response.data;
    } catch {
      const shelf = shelvesData.find((s) => s.id === id);
      if (!shelf) throw new Error('Không tìm thấy kệ sách!');
      const copies = copiesData.filter((c) => c.shelfId === id);
      return { ...shelf, currentUsage: copies.length };
    }
  },

  async createShelf(data: Partial<Shelf>): Promise<Shelf> {
    try {
      const response = await api.post<Shelf>('/shelves', data);
      return response.data;
    } catch {
      const newShelf: Shelf = {
        id: `shelf-${Date.now()}`,
        code: data.code || `KE-${Date.now().toString().slice(-3)}`,
        name: data.name || 'Kệ sách mới',
        location: data.location || 'Tầng 1',
        capacity: data.capacity || 100,
        currentUsage: 0,
        description: data.description || '',
      };
      shelvesData.push(newShelf);
      return newShelf;
    }
  },

  async updateShelf(id: string, data: Partial<Shelf>): Promise<Shelf> {
    try {
      const response = await api.put<Shelf>(`/shelves/${id}`, data);
      return response.data;
    } catch {
      const idx = shelvesData.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('Không tìm thấy kệ sách!');
      shelvesData[idx] = { ...shelvesData[idx], ...data };
      return shelvesData[idx];
    }
  },

  async deleteShelf(id: string): Promise<boolean> {
    try {
      await api.delete(`/shelves/${id}`);
      return true;
    } catch {
      shelvesData = shelvesData.filter((s) => s.id !== id);
      return true;
    }
  },

  async getCopiesByShelf(shelfId: string): Promise<BookCopy[]> {
    try {
      const response = await api.get<BookCopy[]>(`/shelves/${shelfId}/copies`);
      return response.data;
    } catch {
      return copiesData.filter((c) => c.shelfId === shelfId);
    }
  },

  async addCopyToShelf(shelfId: string, copyData: Partial<BookCopy>): Promise<BookCopy> {
    try {
      const response = await api.post<BookCopy>(`/shelves/${shelfId}/copies`, copyData);
      return response.data;
    } catch {
      const shelf = shelvesData.find((s) => s.id === shelfId);
      const newCopy: BookCopy = {
        id: `cp-${Date.now()}`,
        bookId: copyData.bookId || 'b-1',
        bookTitle: copyData.bookTitle || 'Sách mới bổ sung',
        barcode: copyData.barcode || `BC-${Date.now().toString().slice(-6)}`,
        shelfId: shelfId,
        shelfCode: shelf?.code || 'KE-A1',
        shelfLocation: shelf?.location || 'Tầng 1',
        status: (copyData.status as BookCopyStatus) || 'AVAILABLE',
        condition: copyData.condition || 'Mới 100%',
      };
      copiesData.push(newCopy);
      return newCopy;
    }
  },

  async updateCopyStatus(copyId: string, status: BookCopyStatus): Promise<BookCopy> {
    try {
      const response = await api.patch<BookCopy>(`/copies/${copyId}/status`, { status });
      return response.data;
    } catch {
      const copy = copiesData.find((c) => c.id === copyId);
      if (!copy) throw new Error('Không tìm thấy bản sao sách!');
      copy.status = status;
      return copy;
    }
  },
};
