import api, { handleApiErrorOrFallback } from './api';
import { Book, BookCopy } from '@/types';
import { libraryStore } from './libraryStore';

export interface BookFilters {
  search?: string;
  categoryId?: string;
  authorId?: string;
  status?: string;
}

function mapCopy(raw: any, bookId?: string, bookTitle?: string): BookCopy {
  return {
    id: String(raw.id),
    bookId: String(raw.book_id ?? bookId ?? ''),
    bookTitle: raw.book_title || bookTitle,
    barcode: raw.barcode || raw.copy_code || '',
    shelfId: String(raw.shelf_id ?? ''),
    shelfCode: raw.shelfCode || raw.shelf_code || 'Kệ chính',
    shelfLocation: raw.shelfLocation || raw.shelf_location || 'Tầng 1',
    status: raw.status || 'AVAILABLE',
    condition: raw.condition || raw.condition_note || 'Tốt',
    createdAt: raw.created_at,
  };
}

function mapBook(raw: any): Book {
  const id = String(raw.id);
  const title = raw.title || '';
  return {
    id,
    title,
    isbn: raw.isbn || '',
    authorId: String(raw.authorId ?? raw.author_id ?? ''),
    authorName: raw.authorName || raw.author_name || 'Đang cập nhật',
    categoryId: String(raw.categoryId ?? raw.category_id ?? ''),
    categoryName: raw.categoryName || raw.category_name || 'Tài liệu chung',
    publisher: raw.publisher || 'Đang cập nhật',
    publicationYear: raw.publicationYear ?? raw.publish_year ?? new Date().getFullYear(),
    description: raw.description || '',
    coverImage: raw.coverImage || raw.cover_image || undefined,
    totalCopies: Number(raw.totalCopies ?? raw.total_copies ?? 0),
    availableCopies: Number(raw.availableCopies ?? raw.available_copies ?? 0),
    copies: Array.isArray(raw.copies) ? raw.copies.map((c: any) => mapCopy(c, id, title)) : undefined,
  };
}

export const bookService = {
  async getBooks(filters?: BookFilters): Promise<Book[]> {
    try {
      const response = await api.get<any>('/books', {
        params: {
          search: filters?.search || undefined,
          category_id: filters?.categoryId || undefined,
          author_id: filters?.authorId || undefined,
          status: filters?.status || undefined,
          limit: 100,
        },
      });
      const payload = response.data?.data;
      const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      return items.map(mapBook);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
      const response = await api.get<any>(`/books/${id}`);
      const payload = response.data?.data || response.data;
      return mapBook(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const book = libraryStore.getBookById(id);
      if (!book) throw new Error('Không tìm thấy sách!');
      return book;
    }
  },

  async createBook(data: Partial<Book>): Promise<Book> {
    try {
      const response = await api.post<any>('/books', {
        isbn: data.isbn,
        title: data.title,
        author_id: data.authorId,
        category_id: data.categoryId,
        publisher: data.publisher,
        publish_year: data.publicationYear,
        cover_image: data.coverImage,
      });
      const payload = response.data?.data || response.data;
      return mapBook(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
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
      await api.put<any>(`/books/${id}`, {
        isbn: data.isbn,
        title: data.title,
        author_id: data.authorId,
        category_id: data.categoryId,
        publisher: data.publisher,
        publish_year: data.publicationYear,
        cover_image: data.coverImage,
      });
      return await this.getBookById(id);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return libraryStore.updateBook(id, data);
    }
  },

  async deleteBook(id: string): Promise<boolean> {
    try {
      await api.delete(`/books/${id}`);
      return true;
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      libraryStore.deleteBook(id);
      return true;
    }
  },

  async getCopiesByBookId(bookId: string): Promise<BookCopy[]> {
    try {
      const response = await api.get<any>('/copies', { params: { book_id: bookId } });
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map((c: any) => mapCopy(c, bookId)) : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const book = libraryStore.getBookById(bookId);
      return book?.copies || [];
    }
  },
};
