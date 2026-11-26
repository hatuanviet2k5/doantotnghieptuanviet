import api, { handleApiErrorOrFallback } from './api';
import { ReaderCard, ReaderCardStatus } from '@/types';
import { mockReaderCards, mockUsers } from './mockData';

let cardsData = [...mockReaderCards];

function formatDateStr(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.includes('T') ? val.split('T')[0] : val.split(' ')[0];
  return new Date(val).toISOString().split('T')[0];
}

function mapReaderCard(raw: any): ReaderCard {
  return {
    id: String(raw.id),
    cardNumber: raw.cardNumber || raw.card_number || '',
    userId: String(raw.userId ?? raw.user_id ?? ''),
    userFullName: raw.userFullName || raw.full_name || '',
    issueDate: formatDateStr(raw.issueDate || raw.issued_date),
    expiryDate: formatDateStr(raw.expiryDate || raw.expire_date),
    status: (raw.status || 'ACTIVE') as ReaderCardStatus,
    maxBorrowLimit: Number(raw.maxBorrowLimit ?? raw.max_borrow ?? 5),
    currentBorrowCount: Number(raw.currentBorrowCount ?? raw.currently_borrowing_count ?? 0),
  };
}

export const readerCardService = {
  async getReaderCards(): Promise<ReaderCard[]> {
    try {
      const response = await api.get<any>('/reader-cards', { params: { limit: 100 } });
      const payload = response.data?.data;
      const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      return items.map(mapReaderCard);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return cardsData;
    }
  },

  async getCardByUserId(userId: string): Promise<ReaderCard | undefined> {
    try {
      const response = await api.get<any>(`/reader-cards/user/${userId}`);
      const payload = response.data?.data || response.data;
      return payload ? mapReaderCard(payload) : undefined;
    } catch (err: any) {
      if (err?.response?.status === 404) return undefined;
      handleApiErrorOrFallback(err);
      return cardsData.find((c) => c.userId === userId);
    }
  },

  async issueReaderCard(data: { userId: string; maxBorrowLimit?: number }): Promise<ReaderCard> {
    try {
      const response = await api.post<any>('/reader-cards', {
        user_id: data.userId,
        max_borrow: data.maxBorrowLimit || 5,
      });
      const payload = response.data?.data || response.data;
      return mapReaderCard(payload);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const user = mockUsers.find((u) => u.id === data.userId);
      const now = new Date();
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const newCard: ReaderCard = {
        id: `card-${Date.now()}`,
        cardNumber: `DG-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: data.userId,
        userFullName: user?.fullName || 'Độc giả',
        issueDate: now.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        status: 'ACTIVE',
        maxBorrowLimit: data.maxBorrowLimit || 5,
        currentBorrowCount: 0,
      };

      if (user) {
        user.readerCardId = newCard.id;
      }
      cardsData.unshift(newCard);
      return newCard;
    }
  },

  async updateCardStatus(id: string, status: ReaderCardStatus): Promise<ReaderCard> {
    try {
      await api.put<any>(`/reader-cards/${id}/status`, { status });
      const res = await api.get<any>(`/reader-cards/${id}`);
      return mapReaderCard(res.data?.data || res.data);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const card = cardsData.find((c) => c.id === id);
      if (!card) throw new Error('Không tìm thấy thẻ độc giả!');
      card.status = status;
      return card;
    }
  },
};
