import api, { handleApiErrorOrFallback } from './api';
import { BorrowTicket, Statistics } from '@/types';
import { mockStatistics, mockTickets } from './mockData';

export const reportService = {
  async getStatistics(month?: number, year?: number): Promise<Statistics> {
    try {
      const response = await api.get<any>('/reports/statistics', {
        params: { month, year },
      });
      const payload = response.data?.data || response.data;
      if (payload?.summary) {
        return {
          totalBorrows: Number(payload.summary.total_borrows ?? 0),
          totalReturns: Number(payload.summary.total_returns ?? 0),
          totalOverdue: Number(payload.summary.overdue_count ?? 0),
          fineRevenue: Number(payload.summary.fine_revenue ?? 0),
          borrowsByCategory: (payload.borrows_by_category || []).map((c: any) => ({
            category: c.name || c.category,
            count: Number(c.borrow_count ?? c.count ?? 0),
          })),
          monthlyBorrows: (payload.monthly_borrows || []).map((m: any) => ({
            month: m.month,
            borrows: Number(m.borrows ?? 0),
            returns: Number(m.returns ?? 0),
          })),
          recentActivities: (payload.recent_activities || []).map((l: any) => ({
            id: String(l.id),
            actorId: String(l.actor_id ?? ''),
            actorName: l.actor_name || 'Hệ thống',
            actorRole: l.actor_role || 'ADMIN',
            action: l.action,
            entityType: l.entity_type || '',
            entityId: String(l.entity_id ?? ''),
            details: l.details || '',
            timestamp: l.created_at || new Date().toISOString(),
          })),
          overdueTickets: (payload.overdue_tickets || []).map((t: any) => ({
            id: String(t.id),
            ticketCode: t.ticket_code,
            readerCardId: String(t.reader_card_id ?? ''),
            readerCardNumber: t.card_number || '',
            userId: String(t.user_id ?? ''),
            userFullName: t.borrower_name || 'Độc giả',
            borrowDate: t.created_at || '',
            dueDate: t.due_date || '',
            status: 'OVERDUE',
            items: [],
            totalFines: Number(t.estimated_fine ?? 0),
          })),
        };
      }
      return payload;
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return mockStatistics;
    }
  },

  async getOverdueList(): Promise<BorrowTicket[]> {
    try {
      const response = await api.get<any>('/reports/overdue');
      const items = response.data?.data || response.data || [];
      return Array.isArray(items)
        ? items.map((t: any) => ({
            id: String(t.id),
            ticketCode: t.ticket_code,
            readerCardId: String(t.reader_card_id ?? ''),
            readerCardNumber: t.card_number,
            userId: String(t.user_id ?? ''),
            userFullName: t.borrower_name,
            borrowDate: t.created_at || '',
            dueDate: t.due_date || '',
            status: 'OVERDUE',
            items: [],
            totalFines: Number(t.estimated_fine ?? 0),
          }))
        : [];
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      return mockTickets.filter((t) => t.status === 'OVERDUE');
    }
  },

  async exportExcel(month: number, year: number): Promise<void> {
    try {
      const response = await api.get('/reports/export/excel', {
        params: { month, year },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_ThuVien_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      const content = `BÁO CÁO HOẠT ĐỘNG THƯ VIỆN THÁNG ${month}/${year}\n\nChỉ số,Giá trị\nTổng lượt mượn,${mockStatistics.totalBorrows}\nTổng lượt trả,${mockStatistics.totalReturns}\nSách quá hạn,${mockStatistics.totalOverdue}\nTiền phạt thu được,${mockStatistics.fineRevenue} VNĐ\n`;
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), content], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_ThuVien_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  },

  async exportPdf(month: number, year: number): Promise<void> {
    try {
      const response = await api.get('/reports/export/pdf', {
        params: { month, year },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_ThuVien_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      window.print();
    }
  },
};
