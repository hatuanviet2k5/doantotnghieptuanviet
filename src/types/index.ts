export type Role = 'ADMIN' | 'LIBRARIAN' | 'BORROWER';

export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  readerCardId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ReaderCardStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface ReaderCard {
  id: string;
  cardNumber: string;
  userId: string;
  userFullName?: string;
  issueDate: string;
  expiryDate: string;
  status: ReaderCardStatus;
  maxBorrowLimit: number;
  currentBorrowCount: number;
}

export interface Author {
  id: string;
  name: string;
  biography?: string;
  birthYear?: number;
  nationality?: string;
  bookCount?: number;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  bookCount?: number;
}

export interface Shelf {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  currentUsage: number;
  description?: string;
}

export type BookCopyStatus = 'AVAILABLE' | 'HOLDING' | 'BORROWED' | 'LOST' | 'MAINTENANCE';

export interface BookCopy {
  id: string;
  bookId: string;
  bookTitle?: string;
  barcode: string;
  shelfId: string;
  shelfCode?: string;
  shelfLocation?: string;
  status: BookCopyStatus;
  condition: string;
  createdAt?: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  authorId: string;
  author?: Author;
  authorName?: string;
  categoryId: string;
  category?: Category;
  categoryName?: string;
  publisher: string;
  publicationYear: number;
  description: string;
  coverImage?: string;
  totalCopies: number;
  availableCopies: number;
  copies?: BookCopy[];
}

export type TicketStatus = 'PENDING' | 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';

export interface TicketDetail {
  id: string;
  ticketId: string;
  copyId: string;
  bookTitle: string;
  barcode: string;
  status: BookCopyStatus | TicketStatus;
  shelfCode?: string;
  returnedAt?: string;
  fineAmount?: number;
}

export interface BorrowTicket {
  id: string;
  ticketCode: string;
  readerCardId: string;
  readerCardNumber?: string;
  userId: string;
  userName?: string;
  userFullName?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: TicketStatus;
  qrCode?: string;
  holdExpiresAt?: string;
  items: TicketDetail[];
  totalFines?: number;
  notes?: string;
}

export type FineStatus = 'UNPAID' | 'PAID';

export interface Fine {
  id: string;
  ticketId: string;
  ticketCode?: string;
  userId: string;
  userFullName?: string;
  amount: number;
  reason: string;
  status: FineStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'MOMO' | 'VNPAY';

export interface Payment {
  id: string;
  fineId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  transactionId?: string;
  cashierId?: string;
  cashierName?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  readerCard?: ReaderCard;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Statistics {
  totalBorrows: number;
  totalReturns: number;
  totalOverdue: number;
  fineRevenue: number;
  borrowsByCategory: { category: string; count: number }[];
  monthlyBorrows: { month: string; borrows: number; returns: number }[];
  recentActivities: AuditLog[];
  overdueTickets: BorrowTicket[];
}
