import api from './api';
import { BorrowTicket, TicketStatus } from '@/types';
import { mockTickets, mockCopies, mockBooks, mockReaderCards, mockUsers } from './mockData';

let ticketsData = [...mockTickets];

// Helper to generate SVG QR code data url
function generateQRCodeDataUrl(text: string): string {
  // Generates clean SVG data url with the code and pattern
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="100%" height="100%" fill="#ffffff" rx="8"/>
    <!-- Position Detection Patterns -->
    <rect x="20" y="20" width="40" height="40" fill="#1e40af" rx="4"/>
    <rect x="28" y="28" width="24" height="24" fill="#ffffff" rx="2"/>
    <rect x="34" y="34" width="12" height="12" fill="#1e40af" rx="2"/>

    <rect x="140" y="20" width="40" height="40" fill="#1e40af" rx="4"/>
    <rect x="148" y="28" width="24" height="24" fill="#ffffff" rx="2"/>
    <rect x="154" y="34" width="12" height="12" fill="#1e40af" rx="2"/>

    <rect x="20" y="140" width="40" height="40" fill="#1e40af" rx="4"/>
    <rect x="28" y="148" width="24" height="24" fill="#ffffff" rx="2"/>
    <rect x="34" y="154" width="12" height="12" fill="#1e40af" rx="2"/>

    <!-- Simulated Data Grid -->
    <circle cx="80" cy="40" r="5" fill="#1e40af"/>
    <circle cx="100" cy="40" r="5" fill="#1e40af"/>
    <circle cx="120" cy="40" r="5" fill="#1e40af"/>
    <circle cx="70" cy="70" r="5" fill="#1e40af"/>
    <circle cx="90" cy="70" r="5" fill="#1e40af"/>
    <circle cx="110" cy="70" r="5" fill="#1e40af"/>
    <circle cx="130" cy="70" r="5" fill="#1e40af"/>
    <circle cx="80" cy="100" r="6" fill="#2563eb"/>
    <circle cx="100" cy="100" r="6" fill="#2563eb"/>
    <circle cx="120" cy="100" r="6" fill="#2563eb"/>
    <circle cx="70" cy="130" r="5" fill="#1e40af"/>
    <circle cx="90" cy="130" r="5" fill="#1e40af"/>
    <circle cx="110" cy="130" r="5" fill="#1e40af"/>
    <circle cx="130" cy="130" r="5" fill="#1e40af"/>
    <circle cx="140" cy="150" r="5" fill="#1e40af"/>
    <circle cx="160" cy="150" r="5" fill="#1e40af"/>
    <circle cx="140" cy="170" r="5" fill="#1e40af"/>
    <circle cx="170" cy="170" r="5" fill="#1e40af"/>

    <text x="100" y="190" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#1e3a8a">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ticketService = {
  async getTickets(params?: { status?: TicketStatus; userId?: string; search?: string }): Promise<BorrowTicket[]> {
    try {
      const response = await api.get<BorrowTicket[]>('/tickets', { params });
      return response.data;
    } catch {
      let result = [...ticketsData];
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
      const response = await api.get<BorrowTicket>(`/tickets/${id}`);
      return response.data;
    } catch {
      const ticket = ticketsData.find((t) => t.id === id || t.ticketCode === id);
      if (!ticket) throw new Error('Không tìm thấy thông tin phiếu mượn!');
      return ticket;
    }
  },

  async holdBook(copyId: string, readerCardId: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<BorrowTicket>('/tickets/hold', { copyId, readerCardId });
      return response.data;
    } catch {
      // Find copy
      const copy = mockCopies.find((c) => c.id === copyId);
      if (!copy) throw new Error('Không tìm thấy bản sao sách này!');
      if (copy.status !== 'AVAILABLE') throw new Error('Bản sao sách này hiện không còn khả dụng!');

      // Find reader card
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
        userFullName: user?.fullName || 'Lê Hoàng Độc Giả',
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

      ticketsData.unshift(newTicket);
      return newTicket;
    }
  },

  async verifyQR(ticketCode: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<BorrowTicket>('/tickets/verify-qr', { ticketCode });
      return response.data;
    } catch {
      const cleanCode = ticketCode.trim().toUpperCase();
      const ticket = ticketsData.find(
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
      const response = await api.post<BorrowTicket>(`/tickets/${ticketId}/approve`);
      return response.data;
    } catch {
      const ticket = ticketsData.find((t) => t.id === ticketId || t.ticketCode === ticketId);
      if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');
      ticket.status = 'BORROWED';
      ticket.items.forEach((item) => {
        item.status = 'BORROWED';
        const copy = mockCopies.find((c) => c.id === item.copyId);
        if (copy) copy.status = 'BORROWED';
      });
      return ticket;
    }
  },

  async returnBooks(ticketId: string, returnedCopies?: string[]): Promise<BorrowTicket> {
    try {
      const response = await api.post<BorrowTicket>(`/tickets/${ticketId}/return`, { returnedCopies });
      return response.data;
    } catch {
      const ticket = ticketsData.find((t) => t.id === ticketId || t.ticketCode === ticketId);
      if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');
      ticket.status = 'RETURNED';
      ticket.returnDate = new Date().toISOString().split('T')[0];
      ticket.items.forEach((item) => {
        item.status = 'RETURNED';
        item.returnedAt = new Date().toISOString().split('T')[0];
        const copy = mockCopies.find((c) => c.id === item.copyId);
        if (copy) copy.status = 'AVAILABLE';
      });
      return ticket;
    }
  },

  async renewTicket(ticketId: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<BorrowTicket>(`/tickets/${ticketId}/renew`);
      return response.data;
    } catch {
      const ticket = ticketsData.find((t) => t.id === ticketId || t.ticketCode === ticketId);
      if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');
      const currentDue = new Date(ticket.dueDate);
      currentDue.setDate(currentDue.getDate() + 7);
      ticket.dueDate = currentDue.toISOString().split('T')[0];
      return ticket;
    }
  },

  async cancelTicket(ticketId: string): Promise<BorrowTicket> {
    try {
      const response = await api.post<BorrowTicket>(`/tickets/${ticketId}/cancel`);
      return response.data;
    } catch {
      const ticket = ticketsData.find((t) => t.id === ticketId || t.ticketCode === ticketId);
      if (!ticket) throw new Error('Không tìm thấy phiếu mượn!');
      ticket.status = 'CANCELLED';
      ticket.items.forEach((item) => {
        item.status = 'CANCELLED';
        const copy = mockCopies.find((c) => c.id === item.copyId);
        if (copy) copy.status = 'AVAILABLE';
      });
      return ticket;
    }
  },
};
