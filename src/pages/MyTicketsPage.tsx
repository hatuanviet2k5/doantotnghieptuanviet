import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BorrowTicket, TicketStatus } from '@/types';
import { ticketService } from '@/services/ticketService';
import { fineService } from '@/services/fineService';
import { Modal } from '@/components/Modal';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { HoldTimer } from '@/components/HoldTimer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Ticket,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  QrCode,
  XCircle,
  BookOpen,
  DollarSign,
  ChevronRight,
  Barcode,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<BorrowTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TicketStatus | 'ALL'>('ALL');

  // Modal QR inspection
  const [activeTicket, setActiveTicket] = useState<BorrowTicket | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    loadMyTickets();
  }, [user]);

  const loadMyTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getTickets({ userId: user?.id });
      setTickets(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách phiếu mượn: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (ticketId: string) => {
    try {
      const updated = await ticketService.renewTicket(ticketId);
      toast.success(`Đã gia hạn thành công thêm 7 ngày! Hạn trả mới: ${updated.dueDate}`);
      loadMyTickets();
    } catch (err: any) {
      toast.error('Lỗi khi gia hạn: ' + err.message);
    }
  };

  const handleCancel = async (ticketId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn huỷ phiếu giữ sách này?')) {
      try {
        await ticketService.cancelTicket(ticketId);
        toast.success('Đã huỷ phiếu giữ sách.');
        if (isQrModalOpen) setIsQrModalOpen(false);
        loadMyTickets();
      } catch (err: any) {
        toast.error('Lỗi khi huỷ phiếu: ' + err.message);
      }
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            ĐANG GIỮ (PENDING)
          </span>
        );
      case 'BORROWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" />
            ĐANG MƯỢN (BORROWED)
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ĐÃ TRẢ (RETURNED)
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            QUÁ HẠN (OVERDUE)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            ĐÃ HUỶ (CANCELLED)
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (selectedTab === 'ALL') return true;
    return t.status === selectedTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary-600" />
            <span>Phiếu Mượn Của Tôi</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý sách đang giữ chỗ, theo dõi ngày đến hạn trả và gia hạn thời gian mượn
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-medium">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Đang giữ' },
            { key: 'BORROWED', label: 'Đang mượn' },
            { key: 'OVERDUE', label: 'Quá hạn' },
            { key: 'RETURNED', label: 'Đã trả' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedTab === tab.key
                  ? 'bg-white text-primary-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" text="Đang tải danh sách phiếu mượn..." />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Chưa có phiếu mượn nào trong mục này</h3>
          <p className="text-xs text-slate-400 mt-1">
            Bạn có thể duyệt qua danh mục sách để chọn và giữ sách yêu thích.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-primary-900 bg-primary-50 px-3 py-1 rounded-xl border border-primary-200">
                    {t.ticketCode}
                  </span>
                  <span className="text-xs text-slate-400">
                    Mã thẻ: <strong>{t.readerCardNumber || 'DG-2024-001'}</strong>
                  </span>
                </div>
                <div>{getStatusBadge(t.status)}</div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {t.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.bookTitle}</p>
                      <p className="text-slate-500 font-mono mt-0.5">
                        Mã bản sao: {item.barcode} • Kệ: {item.shelfCode || 'Kệ A1'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dates & Actions footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Ngày mượn: <strong>{t.borrowDate}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Hạn trả: <strong className="text-slate-900">{t.dueDate}</strong>
                  </span>
                </div>

                {/* Overdue alert */}
                {t.status === 'OVERDUE' && (
                  <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Tiền phạt trễ hạn: {(t.totalFines || 35000).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {/* Specific actions based on status */}
                <div className="flex items-center gap-2">
                  {t.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          setActiveTicket(t);
                          setIsQrModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-xs transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Mở mã QR nhận sách
                      </button>
                      <button
                        onClick={() => handleCancel(t.id)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition"
                      >
                        Huỷ giữ
                      </button>
                    </>
                  )}

                  {t.status === 'BORROWED' && (
                    <button
                      onClick={() => handleRenew(t.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 rounded-xl font-bold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Gia hạn 7 ngày
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal for PENDING Hold */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`Mã QR Phiếu Giữ Sách - ${activeTicket?.ticketCode}`}
      >
        {activeTicket && (
          <div className="space-y-4">
            {activeTicket.holdExpiresAt && (
              <HoldTimer
                expiresAt={activeTicket.holdExpiresAt}
                onExpire={() => {
                  toast.error('Hết thời gian giữ sách!');
                  setIsQrModalOpen(false);
                  loadMyTickets();
                }}
              />
            )}

            <QRCodeDisplay
              ticketCode={activeTicket.ticketCode}
              qrCode={activeTicket.qrCode}
              size={200}
            />

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
              Xuất trình mã này cho thủ thư tại quầy trước khi đồng hồ đếm ngược hết hạn để nhận sách.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
