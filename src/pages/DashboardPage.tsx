import React, { useState, useEffect } from 'react';
import { Statistics } from '@/types';
import { reportService } from '@/services/reportService';
import { StatsCard } from '@/components/StatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2024);

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await reportService.getStatistics(selectedMonth, selectedYear);
      setStats(data);
    } catch (err: any) {
      toast.error('Không thể tải dữ liệu thống kê: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Đang khởi tạo tệp báo cáo Excel...', { id: 'export' });
      await reportService.exportExcel(selectedMonth, selectedYear);
      toast.success('Xuất file Excel thành công!', { id: 'export' });
    } catch (err: any) {
      toast.error('Lỗi khi xuất Excel: ' + err.message, { id: 'export' });
    }
  };

  const handleExportPdf = async () => {
    try {
      await reportService.exportPdf(selectedMonth, selectedYear);
      toast.success('Đang mở cửa sổ in / xuất PDF!');
    } catch (err: any) {
      toast.error('Lỗi khi xuất PDF: ' + err.message);
    }
  };

  if (loading || !stats) {
    return (
      <div className="py-24">
        <LoadingSpinner size="lg" text="Đang tải dữ liệu bảng điều khiển..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header with Filters & Export */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary-600" />
            <span>Dashboard & Báo Cáo Thống Kê</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng quan hiệu suất lưu thông tài liệu, tình hình mượn trả và doanh thu thư viện
          </p>
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month / Year selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 ml-1" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              {[2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            In / Xuất PDF
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          label="Tổng lượt mượn"
          value={stats.totalBorrows}
          icon={BookOpen}
          color="blue"
          trend={{ value: '+14%', isPositive: true, label: 'so với tháng trước' }}
        />
        <StatsCard
          label="Tổng lượt trả sách"
          value={stats.totalReturns}
          icon={RotateCcw}
          color="green"
          trend={{ value: '+9.2%', isPositive: true, label: 'tỷ lệ đúng hạn cao' }}
        />
        <StatsCard
          label="Sách đang quá hạn"
          value={stats.totalOverdue}
          icon={AlertTriangle}
          color="rose"
          trend={{ value: '-3 sách', isPositive: true, label: 'đã giảm nhẹ' }}
        />
        <StatsCard
          label="Doanh thu tiền phạt"
          value={`${stats.fineRevenue.toLocaleString('vi-VN')} đ`}
          icon={DollarSign}
          color="amber"
          trend={{ value: 'Đã thanh toán 85%', isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Borrows by Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Lượt mượn theo danh mục thể loại
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Mức độ quan tâm của độc giả theo từng nhóm chuyên ngành
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.borrowsByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#93c5fd' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Lượt mượn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Xu hướng lưu thông theo tháng (2024)
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            So sánh số lượt mượn và số lượt trả qua 6 tháng gần nhất
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyBorrows} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="borrows"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  name="Lượt mượn"
                />
                <Line
                  type="monotone"
                  dataKey="returns"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  name="Lượt trả"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Overdue Alert List & Recent System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue alert list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Cảnh Báo Sách Quá Hạn</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {stats.overdueTickets.length} phiếu trễ
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.overdueTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{ticket.userFullName}</p>
                  <p className="text-slate-500 font-mono mt-0.5">
                    Mã thẻ: {ticket.readerCardNumber} • Phiếu: {ticket.ticketCode}
                  </p>
                  <p className="text-slate-600 mt-1">
                    Sách:{' '}
                    <strong>{ticket.items.map((i) => i.bookTitle).join(', ')}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-600">
                    {(ticket.totalFines || 35000).toLocaleString('vi-VN')} đ
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hạn: {ticket.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Hoạt Động Gần Đây</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Thời gian thực</span>
          </div>

          <div className="space-y-3">
            {stats.recentActivities.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-start gap-3"
              >
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-primary-600 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.actorName}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 line-clamp-1">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
