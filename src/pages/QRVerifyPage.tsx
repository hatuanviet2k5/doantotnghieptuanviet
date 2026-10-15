import React, { useState } from 'react';
import { BorrowTicket, TicketStatus } from '@/types';
import { ticketService } from '@/services/ticketService';
import { QRScanner } from '@/components/QRScanner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  CreditCard,
  Barcode,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const QRVerifyPage: React.FC = () => {
  const [scannedTicket, setScannedTicket] = useState<BorrowTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleScan = async (code: string) => {
    if (loading || processing) return;
    setLoading(true);
    setActionResult(null);

    try {
      const ticket = await ticketService.verifyQR(code);
      setScannedTicket(ticket);
      toast.success(`Đã quét mã phiếu: ${ticket.ticketCode}`);
    } catch (err: any) {
      setActionResult({
        type: 'error',
        message: err.message || 'Mã QR không hợp lệ hoặc phiếu không tồn tại trên hệ thống.',
      });
      toast.error('Quét mã thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBorrow = async () => {
    if (!scannedTicket) return;
    setProcessing(true);
    try {
      const updated = await ticketService.approveTicket(scannedTicket.id);
      setScannedTicket(updated);
      setActionResult({
        type: 'success',
        message: `Đã duyệt xuất sách thành công cho độc giả "${scannedTicket.userFullName}". Hạn trả: ${updated.dueDate}`,
      });
      toast.success('Duyệt mượn sách thành công!');
    } catch (err: any) {
      setActionResult({
        type: 'error',
        message: err.message || 'Không thể duyệt mượn sách!',
      });
      toast.error('Lỗi khi duyệt!');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!scannedTicket) return;
    setProcessing(true);
    try {
      const updated = await ticketService.returnBooks(scannedTicket.id);
      setScannedTicket(updated);
      setActionResult({
        type: 'success',
        message: `Đã hoàn tất thủ tục thu hồi sách từ độc giả "${scannedTicket.userFullName}". Bản sao sách đã được đưa trở lại kệ sẵn sàng.`,
      });
      toast.success('Xác nhận trả sách thành công!');
    } catch (err: any) {
      setActionResult({
        type: 'error',
        message: err.message || 'Không thể xử lý trả sách!',
      });
      toast.error('Lỗi khi trả sách!');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetScanner = () => {
    setScannedTicket(null);
    setActionResult(null);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            ĐANG CHỜ DUYỆT (PENDING)
          </span>
        );
      case 'BORROWED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" />
            ĐANG MƯỢN (BORROWED)
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ĐÃ TRẢ (RETURNED)
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            QUÁ HẠN (OVERDUE)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            ĐÃ HUỶ (CANCELLED)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary-600" />
            <span>Quét Mã QR & Xác Thực Phiếu Mượn</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kiểm tra thông tin phiếu mượn qua camera hoặc nhập mã phiếu trực tiếp tại quầy
          </p>
        </div>

        {scannedTicket && (
          <button
            onClick={handleResetScanner}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Quét mã tiếp theo
          </button>
        )}
      </div>

      {/* Grid: Scanner View on Left, Result / Action on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Scanner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Khung ngắm Camera</span>
              <span className="text-[11px] font-normal text-slate-500">
                Tự động nhận diện mã QR
              </span>
            </h3>
            <QRScanner onScan={handleScan} isActive={!scannedTicket} />
          </div>

          {/* Quick test buttons for easy demo */}
          <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-600 mb-2">Mã phiếu mẫu để thử nghiệm nhanh:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleScan('TK-202410-002')}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-slate-700 font-mono transition"
              >
                TK-202410-002 (Pending)
              </button>
              <button
                onClick={() => handleScan('TK-202410-001')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 font-mono transition"
              >
                TK-202410-001 (Borrowed)
              </button>
              <button
                onClick={() => handleScan('TK-202409-045')}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 hover:border-rose-300 border border-slate-200 rounded-lg text-slate-700 font-mono transition"
              >
                TK-202409-045 (Overdue)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Ticket Details & Approval Actions */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <LoadingSpinner size="md" text="Đang tra cứu thông tin phiếu..." />
            </div>
          ) : actionResult && !scannedTicket ? (
            <div
              className={`p-6 rounded-2xl border ${
                actionResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {actionResult.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span>{actionResult.type === 'success' ? 'Thành công' : 'Không thành công'}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed">{actionResult.message}</p>
            </div>
          ) : !scannedTicket ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <QrCode className="w-16 h-16 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-700">Chưa quét mã phiếu nào</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Hướng camera vào mã QR của độc giả hoặc chọn một trong các mã phiếu mẫu bên trái để hiển thị thông tin xử lý.
              </p>
            </div>
          ) : (
            /* Ticket Info Card */
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              {/* Status Alert if action taken */}
              {actionResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    actionResult.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <p className="text-xs font-semibold">{actionResult.message}</p>
                </div>
              )}

              {/* Ticket Top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-mono">MÃ PHIẾU</span>
                  <h3 className="text-xl font-mono font-bold text-slate-900">
                    {scannedTicket.ticketCode}
                  </h3>
                </div>
                <div>{getStatusBadge(scannedTicket.status)}</div>
              </div>

              {/* Reader Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Họ tên độc giả:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary-600" />
                    {scannedTicket.userFullName || 'Độc giả'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Số thẻ thư viện:</span>
                  <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-primary-600" />
                    {scannedTicket.readerCardNumber || 'DG-2024-001'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Ngày mượn / Ngày tạo:</span>
                  <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {scannedTicket.borrowDate}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Hạn trả quy định:</span>
                  <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {scannedTicket.dueDate}
                  </p>
                </div>
              </div>

              {/* Items in ticket */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Danh sách sách yêu cầu trong phiếu:
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {scannedTicket.items.map((item) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.bookTitle}</p>
                        <p className="text-slate-400 font-mono mt-0.5">
                          Mã vạch: {item.barcode} | Kệ: {item.shelfCode || 'Kệ chính'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overdue Alert if any */}
              {scannedTicket.status === 'OVERDUE' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Phiếu đã quá hạn quy định! Tiền phạt trễ hạn dự kiến:</span>
                  </div>
                  <span className="font-bold text-sm text-rose-700">
                    {(scannedTicket.totalFines || 35000).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3 justify-end">
                {scannedTicket.status === 'PENDING' && (
                  <button
                    onClick={handleApproveBorrow}
                    disabled={processing}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Duyệt xuất sách (Mượn)</span>
                  </button>
                )}

                {(scannedTicket.status === 'BORROWED' || scannedTicket.status === 'OVERDUE') && (
                  <button
                    onClick={handleProcessReturn}
                    disabled={processing}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Xác nhận trả sách & Nhập kho</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
