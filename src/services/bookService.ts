import api from './api';
import { Book, BookCopy } from '@/types';
import { mockBooks, mockCopies } from './mockData';

// Maintain in-memory state for fallback
let booksData = [...mockBooks];
let copiesData = [...mockCopies];

export interface BookFilters {
  search?: string;
  categoryId?: string;
  authorId?: string;
  status?: string;
}

export const bookService = {
  async getBooks(filters?: BookFilters): Promise<Book[]> {
    try {
      const response = await api.get<Book[]>('/books', { params: filters });
      return response.data;
    } catch {
      let filtered = [...booksData];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q) ||
            (b.authorName && b.authorName.toLowerCase().includes(q))
        );
      }
      if (filters?.categoryId) {
        filtered = filtered.filter((b) => b.categoryId === filters.categoryId);
      }
      if (filters?.authorId) {
        filtered = filtered.filter((b) => b.authorId === filters.authorId);
      }
      return filtered;
    }
  },

  async getBookById(id: string): Promise<Book> {
    try {
      const response = await api.get<Book>(`/books/${id}`);
      return response.data;
    } catch {
      const book = booksData.find((b) => b.id === id);
      if (!book) throw new Error('Không tìm thấy sách!');
      const copies = copiesData.filter((c) => c.bookId === id);
      return {
        ...book,
        copies,
        totalCopies: copies.length,
        availableCopies: copies.filter((c) => c.status === 'AVAILABLE').length,
      };
    }
  },

  async createBook(data: Partial<Book>): Promise<Book> {
    try {
      const response = await api.post<Book>('/books', data);
      return response.data;
    } catch {
      const newBook: Book = {
        id: `b-${Date.now()}`,
        title: data.title || 'Sách mới',
        isbn: data.isbn || `ISBN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        authorId: data.authorId || 'auth-1',
        authorName: data.authorName || 'Đang cập nhật',
        categoryId: data.categoryId || 'cat-1',
        categoryName: data.categoryName || 'Tổng hợp',
        publisher: data.publisher || 'NXB Giáo Dục',
        publicationYear: data.publicationYear || new Date().getFullYear(),
        description: data.description || '',
        coverImage:
          data.coverImage ||
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
        totalCopies: data.totalCopies || 1,
        availableCopies: data.totalCopies || 1,
        copies: [],
      };

      // Generate default copies
      for (let i = 1; i <= newBook.totalCopies; i++) {
        const copy: BookCopy = {
          id: `cp-${newBook.id}-${i}`,
          bookId: newBook.id,
          bookTitle: newBook.title,
          barcode: `BC-${newBook.id.toUpperCase()}-${i.toString().padStart(3, '0')}`,
          shelfId: 'shelf-1',
          shelfCode: 'KE-A1',
          shelfLocation: 'Tầng 1 - Phòng A101',
          status: 'AVAILABLE',
          condition: 'Mới 100%',
        };
        copiesData.push(copy);
        newBook.copies?.push(copy);
      }

      booksData.unshift(newBook);
      return newBook;
    }
  },

  async updateBook(id: string, data: Partial<Book>): Promise<Book> {
    try {
      const response = await api.put<Book>(`/books/${id}`, data);
      return response.data;
    } catch {
      const index = booksData.findIndex((b) => b.id === id);
      if (index === -1) throw new Error('Không tìm thấy sách để cập nhật!');
      booksData[index] = { ...booksData[index], ...data };
      return booksData[index];
    }
  },

  async deleteBook(id: string): Promise<boolean> {
    try {
      await api.delete(`/books/${id}`);
      return true;
    } catch {
      booksData = booksData.filter((b) => b.id !== id);
      copiesData = copiesData.filter((c) => c.bookId !== id);
      return true;
    }
  },

  async getCopiesByBookId(bookId: string): Promise<BookCopy[]> {
    try {
      const response = await api.get<BookCopy[]>(`/books/${bookId}/copies`);
      return response.data;
    } catch {
      return copiesData.filter((c) => c.bookId === bookId);
    }
  },
};
