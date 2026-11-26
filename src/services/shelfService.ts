import api, { handleApiErrorOrFallback } from './api';
import { Shelf, BookCopy, BookCopyStatus } from '@/types';
import { mockShelves, mockCopies } from './mockData';

let shelvesData = [...mockShelves];
let copiesData = [...mockCopies];

function mapShelf(raw: any): Shelf {
  return {
    id: String(raw.id),
    code: raw.code || raw.shelf_code || '',
    name: raw.name || raw.shelf_code || '',
    location: raw.location || '',
    capacity: Number(raw.capacity ?? 50),
    currentUsage: Number(raw.currentUsage ?? raw.current_copies ?? 0),
    description: raw.description || '',
  };
}

function mapCopy(raw: any): BookCopy {
  return {
    id: String(raw.id),
    bookId: String(raw.bookId ?? raw.book_id ?? ''),
    bookTitle: raw.bookTitle || raw.book_title || '',
    barcode: raw.barcode || raw.copy_code || '',
    shelfId: String(raw.shelfId ?? raw.shelf_id ?? ''),
    shelfCode: raw.shelfCode || raw.shelf_code || '',
    shelfLocation: raw.shelfLocation || raw.shelf_location || '',
    status: (raw.status || 'AVAILABLE') as BookCopyStatus,
    condition: raw.condition || raw.condition_note || 'Tốt',
    createdAt: raw.created_at,
  };
}

export const shelfService = {
  async getShelves(): Promise<Shelf[]> {
    try {
      const response = await api.get<any>('/shelves');
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapShelf) : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return shelvesData.map((s) => {
        const copies = copiesData.filter((c) => c.shelfId === s.id);
        return { ...s, currentUsage: copies.length };
      });
    }
  },

  async getShelfById(id: string): Promise<Shelf> {
    try {
      const response = await api.get<any>(`/shelves/${id}`);
      const payload = response.data?.data || response.data;
      return mapShelf(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const shelf = shelvesData.find((s) => s.id === id);
      if (!shelf) throw new Error('Không tìm thấy kệ sách!');
      const copies = copiesData.filter((c) => c.shelfId === id);
      return { ...shelf, currentUsage: copies.length };
    }
  },

  async createShelf(data: Partial<Shelf>): Promise<Shelf> {
    try {
      const response = await api.post<any>('/shelves', {
        shelf_code: data.code,
        location: data.location,
        capacity: data.capacity || 50,
      });
      return mapShelf(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
      await api.put<any>(`/shelves/${id}`, {
        shelf_code: data.code,
        location: data.location,
        capacity: data.capacity,
      });
      return await this.getShelfById(id);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      shelvesData = shelvesData.filter((s) => s.id !== id);
      return true;
    }
  },

  async getCopiesByShelf(shelfId: string): Promise<BookCopy[]> {
    try {
      const response = await api.get<any>('/copies', { params: { shelf_id: shelfId } });
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapCopy) : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return copiesData.filter((c) => c.shelfId === shelfId);
    }
  },

  async addCopyToShelf(shelfId: string, copyData: Partial<BookCopy>): Promise<BookCopy> {
    try {
      const response = await api.post<any>(`/shelves/${shelfId}/copies`, {
        book_id: copyData.bookId,
        copy_code: copyData.barcode,
        condition_note: copyData.condition,
        status: copyData.status || 'AVAILABLE',
      });
      return mapCopy(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const shelf = shelvesData.find((s) => s.id === shelfId);
      const newCopy: BookCopy = {
        id: `cp-${Date.now()}`,
        bookId: copyData.bookId || 'b-1',
        bookTitle: copyData.bookTitle || 'Sách mới bổ sung',
        barcode: copyData.barcode || `BC-${Date.now().toString().slice(-6)}`,
        shelfId,
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
      const response = await api.put<any>(`/copies/${copyId}`, { status });
      return mapCopy(response.data?.data || response.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const copy = copiesData.find((c) => c.id === copyId);
      if (!copy) throw new Error('Không tìm thấy bản sao sách!');
      copy.status = status;
      return copy;
    }
  },
};
