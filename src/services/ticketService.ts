import api, { handleApiErrorOrFallback } from './api';
import { BorrowTicket, TicketDetail, TicketStatus } from '@/types';
import { libraryStore } from './libraryStore';
import { mockReaderCards, mockUsers } from './mockData';

function formatDateStr(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    return val.includes('T') ? val.split('T')[0] : val.split(' ')[0];
  }
  return new Date(val).toISOString().split('T')[0];
}

function mapTicketItem(raw: any, ticketId: string): TicketDetail {
  return {
    id: String(raw.id || raw.copy_id),
    ticketId,
    copyId: String(raw.copy_id ?? raw.copyId ?? ''),
    bookTitle: raw.book_title || raw.title || raw.bookTitle || 'Sách mượn',
    barcode: raw.copy_code || raw.barcode || '',
    status: raw.copy_status || raw.status || 'AVAILABLE',
    shelfCode: raw.shelf_code || raw.shelfCode,
  };
}

function mapTicket(raw: any): BorrowTicket {
  const id = String(raw.id ?? raw.ticket_id);
  const rawItems = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.copies) ? raw.copies : [];
  return {
    id,
    ticketCode: raw.ticket_code || raw.ticketCode || '',
    readerCardId: String(raw.reader_card_id ?? raw.readerCardId ?? ''),
    readerCardNumber: raw.card_number || raw.readerCardNumber || '',
    userId: String(raw.user_id ?? raw.userId ?? ''),
    userName: raw.username || raw.userName,
    userFullName: raw.borrower_name || raw.userFullName || 'Độc giả',
    borrowDate: formatDateStr(raw.created_at || raw.borrowDate),
    dueDate: formatDateStr(raw.due_date || raw.dueDate),
    returnDate: raw.return_date ? formatDateStr(raw.return_date) : raw.returnDate,
    status: raw.status || 'PENDING',
    qrCode: raw.qr_data || raw.qr_code || raw.qrCode,
    holdExpiresAt: raw.hold_expires_at || raw.holdExpiresAt,
    items: rawItems.map((i: any) => mapTicketItem(i, id)),
    totalFines: raw.fine?.fine_amount ? Number(raw.fine.fine_amount) : raw.fine_amount ? Number(raw.fine_amount) : raw.totalFines,
  };
}

// Helper to generate SVG QR code data url for offline mock fallback
function generateQRCodeDataUrl(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="100%" height="100%" fill="#ffffff" rx="8"/>
    <rect x="20" y="20" width="40" height="40" fill="#1e40af" rx="4"/>
    <rect x="28" y="28" width="24" height="24" fill="#ffffff" rx="2"/>
    <rect x="34" y="34" width="12" height="12" fill="#1e40af" rx="2"/>
    <rect x="140" y="20" width="40" height="40" fill="#1e40af" rx="4"/>
    <rect x="148" y="28" width="24" height="24" fill="#ffffff" rx="2"/>
    <rect x="154" y="34" width="12" height="12" fill="#1e40af" rx="2"/>
    <rect x="20" y="140" width="40" height="40" fill="#1e40af" rx="4"/>
    <rect x="28" y="148" width="24" height="24" fill="#ffffff" rx="2"/>
    <rect x="34" y="154" width="12" height="12" fill="#1e40af" rx="2"/>
    <circle cx="100" cy="100" r="14" fill="#2563eb"/>
    <text x="100" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#1e3a8a">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ticketService = {
  async getTickets(params?: { status?: TicketStatus; userId?: string; search?: string }): Promise<BorrowTicket[]> {
    try {
      const response = await api.get<any>('/tickets', {
        params: {
          status: params?.status || undefined,
          search: params?.search || undefined,
          limit: 100,
        },
      });
      const payload = response.data?.data;
      const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      return items.map(mapTicket);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      let result = libraryStore.getTickets();
      if (params?.status) {
        result = result.filter((t) => t.status === params.status);
      }
      if (params?.userId) {
        result = result.filter((t) => t.userId === params.userId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.ticketCode.toLowerCase().includes(q) ||
            t.userFullName?.toLowerCase().includes(q) ||
            t.readerCardNumber?.toLowerCase().includes(q) ||
            t.items.some((i) => i.bookTitle.toLowerCase().includes(q) || i.barcode.toLowerCase().includes(q))
        );
      }
      return result;
    }
  },

  async getTicketById(id: string): Promise<BorrowTicket> {
    try {
      const response = await api.get<any>(`/tickets/${id}`);
      const payload = response.data?.data || response.data;
      return mapTicket(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const tickets = libraryStore.getTickets();
      const ticket = tickets.find((t) => t.id === id || t.ticketCode === id);
      if (!ticket) throw new Error('Không tìm thấy thông tin phiếu mượn!');
      return ticket;
    }
  },

  async holdBook(copyId: string, readerCardId: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<any>('/tickets/hold', {
        copy_id: copyId,
        reader_card_id: readerCardId,
      });
      const payload = response.data?.data || response.data;
      return mapTicket(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const copies = libraryStore.getCopies();
      const copy = copies.find((c) => c.id === copyId);
      if (!copy) throw new Error('Không tìm thấy bản sao sách này!');
      if (copy.status !== 'AVAILABLE') throw new Error('Bản sao sách này hiện không còn khả dụng!');

      const card = mockReaderCards.find((c) => c.id === readerCardId || c.cardNumber === readerCardId);
      const user = card ? mockUsers.find((u) => u.id === card.userId) : mockUsers[2];

      const ticketCode = `TK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const qrCode = generateQRCodeDataUrl(ticketCode);
      const now = new Date();
      const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      copy.status = 'HOLDING';

      const newTicket: BorrowTicket = {
        id: `ticket-${Date.now()}`,
        ticketCode,
        readerCardId: card?.id || 'card-001',
        readerCardNumber: card?.cardNumber || 'DG-2024-001',
        userId: user?.id || 'user-borrower',
        userName: user?.username || 'borrower',
        userFullName: user?.fullName || 'Độc giả',
        borrowDate: now.toISOString().split('T')[0],
        dueDate,
        status: 'PENDING',
        holdExpiresAt,
        qrCode,
        items: [
          {
            id: `td-${Date.now()}`,
            ticketId: `ticket-${Date.now()}`,
            copyId: copy.id,
            bookTitle: copy.bookTitle || 'Sách mượn',
            barcode: copy.barcode,
            shelfCode: copy.shelfCode,
            status: 'HOLDING',
          },
        ],
      };

      libraryStore.addTicket(newTicket);
      return newTicket;
    }
  },

  async verifyQR(ticketCode: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<any>('/tickets/verify-qr', {
        ticket_code: ticketCode,
      });
      const payload = response.data?.data || response.data;
      if (payload?.ticket_id) {
        return await this.getTicketById(String(payload.ticket_id));
      }
      return mapTicket(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const cleanCode = ticketCode.trim().toUpperCase();
      const tickets = libraryStore.getTickets();
      const ticket = tickets.find(
        (t) => t.ticketCode.toUpperCase() === cleanCode || t.id.toUpperCase() === cleanCode
      );
      if (!ticket) {
        throw new Error(`Không tìm thấy mã phiếu hợp lệ: "${ticketCode}"`);
      }
      return ticket;
    }
  },

  async approveTicket(ticketId: string): Promise<BorrowTicket> {
    try {
      await api.post<any>(`/tickets/${ticketId}/approve`);
      return await this.getTicketById(ticketId);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return libraryStore.approveTicket(ticketId);
    }
  },

  async returnBooks(ticketId: string): Promise<BorrowTicket> {
    try {
      await api.post<any>('/tickets/return', { ticket_id: ticketId });
      return await this.getTicketById(ticketId);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return libraryStore.returnTicket(ticketId);
    }
  },

  async renewTicket(ticketId: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<any>(`/tickets/renew/${ticketId}`);
      const payload = response.data?.data;
      if (payload?.ticket_id) {
        return await this.getTicketById(String(payload.ticket_id));
      }
      return await this.getTicketById(ticketId);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const tickets = libraryStore.getTickets();
      const ticket = tickets.find((t) => t.id === ticketId || t.ticketCode === ticketId);
      if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');
      const currentDue = new Date(ticket.dueDate);
      currentDue.setDate(currentDue.getDate() + 7);
      ticket.dueDate = currentDue.toISOString().split('T')[0];
      return ticket;
    }
  },

  async cancelTicket(ticketId: string): Promise<BorrowTicket> {
    try {
      await api.post<any>(`/tickets/cancel/${ticketId}`);
      return await this.getTicketById(ticketId);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return libraryStore.cancelTicket(ticketId);
    }
  },
};
