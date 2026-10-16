import React, { useState, useEffect } from 'react';
import { BorrowTicket, TicketStatus } from '@/types';
import { ticketService } from '@/services/ticketService';
import { DataTable, Column } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import {
  FileText,
  Search,
  Check,
  RotateCcw,
  Eye,
  XCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  User,
  CreditCard,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { SYNC_EVENT_NAME } from '@/services/libraryStore';

export const TicketManagementPage: React.FC = () => {
  const [tickets, setTickets] = useState<BorrowTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Selected ticket modal
  const [selectedTicket, setSelectedTicket] = useState<BorrowTicket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadTickets();

    const handleSync = () => {
      loadTickets(false);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
    };
  }, []);

  const loadTickets = async (showLoading: boolean | any = true) => {
    const shouldShow = typeof showLoading === 'boolean' ? showLoading : true;
    if (shouldShow) setLoading(true);
    try {
      const data = await ticketService.getTickets();
      setTickets(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách phiếu: ' + err.message);
    } finally {
      if (shouldShow) setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await ticketService.approveTicket(id);
      toast.success('Đã duyệt xuất sách thành công! Đã đồng bộ và giảm 1 cuốn khả dụng.');
      loadTickets();
      if (selectedTicket?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      toast.error('Lỗi khi duyệt: ' + err.message);
    }
  };

  const handleReturn = async (id: string) => {
    try {
      await ticketService.returnBooks(id);
      toast.success('Đã xác nhận trả sách và cập nhật bản sao!');
      loadTickets();
      if (selectedTicket?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      toast.error('Lỗi khi trả sách: ' + err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn huỷ phiếu mượn này?')) {
      try {
        await ticketService.cancelTicket(id);
        toast.success('Đã huỷ phiếu mượn.');
        loadTickets();
        if (selectedTicket?.id === id) {
          setIsDetailModalOpen(false);
        }
      } catch (err: any) {
        toast.error('Lỗi khi huỷ: ' + err.message);
      }
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            PENDING (Chờ nhận)
          </span>
        );
      case 'BORROWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" />
            BORROWED (Đang mượn)
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RETURNED (Đã trả)
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            OVERDUE (Quá hạn)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            CANCELLED (Đã huỷ)
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.ticketCode.toLowerCase().includes(q) ||
      (t.userFullName && t.userFullName.toLowerCase().includes(q)) ||
      (t.readerCardNumber && t.readerCardNumber.toLowerCase().includes(q)) ||
      t.items.some((i) => i.bookTitle.toLowerCase().includes(q) || i.barcode.toLowerCase().includes(q));

    const matchesStatus = !statusFilter || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<BorrowTicket>[] = [
    {
      header: 'Mã phiếu',
      accessor: 'ticketCode',
      render: (t) => (
        <span className="font-mono font-bold text-xs text-primary-900 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
          {t.ticketCode}
        </span>
      ),
    },
    {
      header: 'Độc giả',
      render: (t) => (
        <div>
          <span className="font-bold text-slate-800 text-xs">{t.userFullName || 'Độc giả'}</span>
          <p className="font-mono text-[11px] text-slate-400 mt-0.5">
            Thẻ: {t.readerCardNumber || 'DG-2024-001'}
          </p>
        </div>
      ),
    },
    {
      header: 'Tài liệu mượn',
      render: (t) => (
        <div className="space-y-0.5 text-xs max-w-xs">
          {t.items.map((i) => (
            <div key={i.id} className="truncate">
              <span className="font-semibold text-slate-800">{i.bookTitle}</span>
              <span className="text-slate-400 font-mono text-[11px]"> ({i.barcode})</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Hạn trả',
      accessor: 'dueDate',
      render: (t) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{t.dueDate}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Mượn: {t.borrowDate}</p>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (t) => getStatusBadge(t.status),
    },
    {
      header: 'Thao tác nhanh',
      className: 'text-right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedTicket(t);
              setIsDetailModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition"
            title="Xem chi tiết & QR"
          >
            <Eye className="w-4 h-4" />
          </button>

          {t.status === 'PENDING' && (
            <button
              onClick={() => handleApprove(t.id)}
              className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Duyệt xuất sách"
            >
              Duyệt
            </button>
          )}

          {(t.status === 'BORROWED' || t.status === 'OVERDUE') && (
            <button
              onClick={() => handleReturn(t.id)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Thu hồi sách"
            >
              Trả sách
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            <span>Quản Lý Phiếu Mượn & Lưu Thông</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi danh sách toàn bộ phiếu mượn, duyệt giữ sách và xử lý hoàn trả sách
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, tên độc giả, tên sách, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="PENDING">PENDING (Chờ duyệt nhận)</option>
            <option value="BORROWED">BORROWED (Đang mượn)</option>
            <option value="RETURNED">RETURNED (Đã trả)</option>
            <option value="OVERDUE">OVERDUE (Quá hạn)</option>
            <option value="CANCELLED">CANCELLED (Đã huỷ)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTickets}
        loading={loading}
        emptyMessage="Không có phiếu mượn nào phù hợp"
        pageSize={8}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Chi tiết phiếu mượn ${selectedTicket?.ticketCode}`}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-mono">MÃ PHIẾU</span>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {selectedTicket.ticketCode}
                </p>
              </div>
              <div>{getStatusBadge(selectedTicket.status)}</div>
            </div>

            {/* Reader & Time info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-medium">Độc giả</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {selectedTicket.userFullName}
                </p>
                <p className="text-slate-400 font-mono mt-0.5">
                  Thẻ: {selectedTicket.readerCardNumber}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-medium">Thời gian</span>
                <p className="text-slate-700 mt-0.5">Mượn: {selectedTicket.borrowDate}</p>
                <p className="font-bold text-slate-900 mt-0.5">Hạn trả: {selectedTicket.dueDate}</p>
              </div>
            </div>

            {/* Books in ticket */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Các cuốn sách trong phiếu:
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {selectedTicket.items.map((item) => (
                  <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.bookTitle}</p>
                      <p className="text-slate-500 font-mono mt-0.5">
                        Mã vạch: {item.barcode} • Kệ: {item.shelfCode || 'Kệ chính'}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR code view */}
            <div className="flex justify-center pt-2">
              <QRCodeDisplay
                ticketCode={selectedTicket.ticketCode}
                qrCode={selectedTicket.qrCode}
                size={140}
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              {selectedTicket.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleCancel(selectedTicket.id)}
                    className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                  >
                    Huỷ phiếu
                  </button>
                  <button
                    onClick={() => handleApprove(selectedTicket.id)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Duyệt xuất sách
                  </button>
                </>
              )}

              {(selectedTicket.status === 'BORROWED' || selectedTicket.status === 'OVERDUE') && (
                <button
                  onClick={() => handleReturn(selectedTicket.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Xác nhận nhận trả sách
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
