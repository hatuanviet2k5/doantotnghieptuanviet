import api from './api';
import { Book, BookCopy } from '@/types';
import { libraryStore } from './libraryStore';

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
      let filtered = libraryStore.getBooks();
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
      const book = libraryStore.getBookById(id);
      if (!book) throw new Error('Không tìm thấy sách!');
      return book;
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
        coverImage: data.coverImage || '/covers/default.svg',
        totalCopies: data.totalCopies || 25,
        availableCopies: data.totalCopies || 25,
        copies: [],
      };

      return libraryStore.createBook(newBook, data.totalCopies || 25);
    }
  },

  async updateBook(id: string, data: Partial<Book>): Promise<Book> {
    try {
      const response = await api.put<Book>(`/books/${id}`, data);
      return response.data;
    } catch {
      return libraryStore.updateBook(id, data);
    }
  },

  async deleteBook(id: string): Promise<boolean> {
    try {
      await api.delete(`/books/${id}`);
      return true;
    } catch {
      libraryStore.deleteBook(id);
      return true;
    }
  },

  async getCopiesByBookId(bookId: string): Promise<BookCopy[]> {
    try {
      const response = await api.get<BookCopy[]>(`/books/${bookId}/copies`);
      return response.data;
    } catch {
      const book = libraryStore.getBookById(bookId);
      return book?.copies || [];
    }
  },
};
