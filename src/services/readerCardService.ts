import api from './api';
import { ReaderCard, ReaderCardStatus } from '@/types';
import { mockReaderCards, mockUsers } from './mockData';

let cardsData = [...mockReaderCards];

export const readerCardService = {
  async getReaderCards(): Promise<ReaderCard[]> {
    try {
      const response = await api.get<ReaderCard[]>('/reader-cards');
      return response.data;
    } catch {
      return cardsData;
    }
  },

  async getCardByUserId(userId: string): Promise<ReaderCard | undefined> {
    try {
      const response = await api.get<ReaderCard>(`/reader-cards/user/${userId}`);
      return response.data;
    } catch {
      return cardsData.find((c) => c.userId === userId);
    }
  },

  async issueReaderCard(data: { userId: string; maxBorrowLimit?: number }): Promise<ReaderCard> {
    try {
      const response = await api.post<ReaderCard>('/reader-cards', data);
      return response.data;
    } catch {
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
      const response = await api.patch<ReaderCard>(`/reader-cards/${id}/status`, { status });
      return response.data;
    } catch {
      const card = cardsData.find((c) => c.id === id);
      if (!card) throw new Error('Không tìm thấy thẻ độc giả!');
      card.status = status;
      return card;
    }
  },
};
