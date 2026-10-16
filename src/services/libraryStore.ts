import { Book, BookCopy, BorrowTicket } from '@/types';
import { mockBooks, mockCopies, mockTickets } from './mockData';

const STORAGE_KEYS = {
  BOOKS: 'library_books_v3',
  COPIES: 'library_copies_v3',
  TICKETS: 'library_tickets_v3',
};

// Custom event for cross-component / real-time synchronization
export const SYNC_EVENT_NAME = 'library-data-synced';

export const dispatchLibrarySync = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  }
};

class LibraryStore {
  private books: Book[];
  private copies: BookCopy[];
  private tickets: BorrowTicket[];

  constructor() {
    this.books = this.loadBooks();
    this.copies = this.loadCopies();
    this.tickets = this.loadTickets();
    this.recalculateAllAvailableCopies();
  }

  private loadBooks(): Book[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 16) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse books from localStorage', e);
    }
    return JSON.parse(JSON.stringify(mockBooks));
  }

  private loadCopies(): BookCopy[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COPIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 400) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse copies from localStorage', e);
    }
    return JSON.parse(JSON.stringify(mockCopies));
  }

  private loadTickets(): BorrowTicket[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse tickets from localStorage', e);
    }
    return JSON.parse(JSON.stringify(mockTickets));
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(this.books));
      localStorage.setItem(STORAGE_KEYS.COPIES, JSON.stringify(this.copies));
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(this.tickets));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
    dispatchLibrarySync();
  }

  public recalculateAllAvailableCopies() {
    for (const b of this.books) {
      const bCopies = this.copies.filter((c) => c.bookId === b.id);
      b.totalCopies = bCopies.length;
      // Only AVAILABLE status counts towards availableCopies
      b.availableCopies = bCopies.filter((c) => c.status === 'AVAILABLE').length;
      b.copies = bCopies;
    }
  }

  public getBooks(): Book[] {
    this.recalculateAllAvailableCopies();
    return [...this.books];
  }

  public getBookById(id: string): Book | undefined {
    this.recalculateAllAvailableCopies();
    return this.books.find((b) => b.id === id);
  }

  public getCopies(): BookCopy[] {
    return [...this.copies];
  }

  public getTickets(): BorrowTicket[] {
    return [...this.tickets];
  }

  public updateCopyStatus(copyId: string, status: 'AVAILABLE' | 'BORROWED' | 'HOLDING') {
    const copy = this.copies.find((c) => c.id === copyId);
    if (copy) {
      copy.status = status;
      this.recalculateAllAvailableCopies();
      this.save();
    }
  }

  public addTicket(ticket: BorrowTicket) {
    this.tickets.unshift(ticket);
    this.recalculateAllAvailableCopies();
    this.save();
  }

  public approveTicket(ticketId: string): BorrowTicket {
    const ticket = this.tickets.find((t) => t.id === ticketId || t.ticketCode === ticketId);
    if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');
    
    ticket.status = 'BORROWED';
    ticket.items.forEach((item) => {
      item.status = 'BORROWED';
      const copy = this.copies.find((c) => c.id === item.copyId);
      if (copy) {
        copy.status = 'BORROWED';
      }
    });

    this.recalculateAllAvailableCopies();
    this.save();
    return ticket;
  }

  public returnTicket(ticketId: string): BorrowTicket {
    const ticket = this.tickets.find((t) => t.id === ticketId || t.ticketCode === ticketId);
    if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');

    ticket.status = 'RETURNED';
    ticket.returnDate = new Date().toISOString().split('T')[0];
    ticket.items.forEach((item) => {
      item.status = 'RETURNED';
      item.returnedAt = new Date().toISOString().split('T')[0];
      const copy = this.copies.find((c) => c.id === item.copyId);
      if (copy) {
        copy.status = 'AVAILABLE';
      }
    });

    this.recalculateAllAvailableCopies();
    this.save();
    return ticket;
  }

  public cancelTicket(ticketId: string): BorrowTicket {
    const ticket = this.tickets.find((t) => t.id === ticketId || t.ticketCode === ticketId);
    if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');

    ticket.status = 'CANCELLED';
    ticket.items.forEach((item) => {
      item.status = 'CANCELLED';
      const copy = this.copies.find((c) => c.id === item.copyId);
      if (copy) {
        copy.status = 'AVAILABLE';
      }
    });

    this.recalculateAllAvailableCopies();
    this.save();
    return ticket;
  }

  public createBook(book: Book, countCopies = 25): Book {
    this.books.unshift(book);
    const newCopies: BookCopy[] = [];
    for (let i = 1; i <= countCopies; i++) {
      newCopies.push({
        id: `cp-${book.id}-${String(i).padStart(3, '0')}`,
        bookId: book.id,
        bookTitle: book.title,
        barcode: `BC-${book.id.toUpperCase()}-${String(i).padStart(3, '0')}`,
        shelfId: 'shelf-1',
        shelfCode: 'KE-A1',
        shelfLocation: 'Tầng 1 - Phòng A101',
        status: 'AVAILABLE',
        condition: 'Mới 100%'
      });
    }
    this.copies.push(...newCopies);
    this.recalculateAllAvailableCopies();
    this.save();
    return book;
  }

  public updateBook(id: string, data: Partial<Book>): Book {
    const idx = this.books.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Không tìm thấy sách');
    this.books[idx] = { ...this.books[idx], ...data };
    this.recalculateAllAvailableCopies();
    this.save();
    return this.books[idx];
  }

  public deleteBook(id: string) {
    this.books = this.books.filter((b) => b.id !== id);
    this.copies = this.copies.filter((c) => c.bookId !== id);
    this.recalculateAllAvailableCopies();
    this.save();
  }
}

export const libraryStore = new LibraryStore();
