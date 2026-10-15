import api from './api';
import { Fine, PaymentMethod } from '@/types';
import { mockFines } from './mockData';

let finesData = [...mockFines];

export const fineService = {
  async getFines(): Promise<Fine[]> {
    try {
      const response = await api.get<Fine[]>('/fines');
      return response.data;
    } catch {
      return finesData;
    }
  },

  async getUserFines(userId: string): Promise<Fine[]> {
    try {
      const response = await api.get<Fine[]>(`/fines/user/${userId}`);
      return response.data;
    } catch {
      return finesData.filter((f) => f.userId === userId);
    }
  },

  async payFine(fineId: string, paymentMethod: PaymentMethod, _amount?: number): Promise<Fine> {
    try {
      const response = await api.post<Fine>(`/fines/${fineId}/pay`, { paymentMethod, amount: _amount });
      return response.data;
    } catch {
      const fine = finesData.find((f) => f.id === fineId);
      if (!fine) throw new Error('Không tìm thấy bản ghi tiền phạt!');
      fine.status = 'PAID';
      fine.paidAt = new Date().toISOString();
      fine.paymentMethod = paymentMethod;
      return fine;
    }
  },
};
