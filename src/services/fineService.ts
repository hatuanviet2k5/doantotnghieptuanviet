import api, { handleApiErrorOrFallback } from './api';
import { Fine, FineStatus, PaymentMethod } from '@/types';
import { mockFines } from './mockData';

let finesData = [...mockFines];

function mapFine(raw: any): Fine {
  return {
    id: String(raw.id),
    ticketId: String(raw.ticketId ?? raw.ticket_id ?? ''),
    ticketCode: raw.ticketCode || raw.ticket_code || '',
    userId: String(raw.userId ?? raw.user_id ?? ''),
    userFullName: raw.userFullName || raw.borrower_name || '',
    amount: Number(raw.amount ?? raw.fine_amount ?? 0),
    reason: raw.reason || 'OVERDUE',
    status: (raw.status || 'UNPAID') as FineStatus,
    dueDate: raw.dueDate || raw.due_date || '',
    paidAt: raw.paidAt || raw.paid_at,
    paymentMethod: raw.paymentMethod || raw.payment_method,
  };
}

export const fineService = {
  async getFines(): Promise<Fine[]> {
    try {
      const response = await api.get<any>('/fines', { params: { limit: 100 } });
      const payload = response.data?.data;
      const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      return items.map(mapFine);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return finesData;
    }
  },

  async getUserFines(userId: string): Promise<Fine[]> {
    try {
      const response = await api.get<any>(`/fines/user/${userId}`);
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items.map(mapFine) : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return finesData.filter((f) => f.userId === userId);
    }
  },

  async payFine(fineId: string, paymentMethod: PaymentMethod, amount?: number): Promise<Fine> {
    try {
      const response = await api.post<any>('/fines/pay', {
        fine_id: fineId,
        payment_method: paymentMethod,
        amount,
      });
      const payload = response.data?.data || response.data;
      return mapFine({ ...payload, id: fineId, status: 'PAID' });
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const fine = finesData.find((f) => f.id === fineId);
      if (!fine) throw new Error('Không tìm thấy bản ghi tiền phạt!');
      fine.status = 'PAID';
      fine.paidAt = new Date().toISOString();
      fine.paymentMethod = paymentMethod;
      return fine;
    }
  },
};
