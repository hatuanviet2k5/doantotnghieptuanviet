import api from './api';
import { BorrowTicket, Statistics } from '@/types';
import { mockStatistics, mockTickets } from './mockData';

export const reportService = {
  async getStatistics(_month?: number, _year?: number): Promise<Statistics> {
    try {
      const response = await api.get<Statistics>('/reports/statistics', {
        params: { month: _month, year: _year },
      });
      return response.data;
    } catch {
      return mockStatistics;
    }
  },

  async getOverdueList(): Promise<BorrowTicket[]> {
    try {
      const response = await api.get<BorrowTicket[]>('/reports/overdue');
      return response.data;
    } catch {
      return mockTickets.filter((t) => t.status === 'OVERDUE');
    }
  },

  async exportExcel(month: number, year: number): Promise<void> {
    try {
      const response = await api.get('/reports/export-excel', {
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
    } catch {
      // Mock CSV/Excel download
      const content = `BÁO CÁO HOẠT ĐỘNG THƯ VIỆN THÁNG ${month}/${year}\n\nChỉ số,Giá trị\nTổng lượt mượn,${mockStatistics.totalBorrows}\nTổng lượt trả,${mockStatistics.totalReturns}\nSách quá hạn,${mockStatistics.totalOverdue}\nTiền phạt thu được,${mockStatistics.fineRevenue} VNĐ\n`;
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
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
      const response = await api.get('/reports/export-pdf', {
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
    } catch {
      // Trigger browser print as PDF for report
      window.print();
    }
  },
};
