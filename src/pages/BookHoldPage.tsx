import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Book, BookCopy, BorrowTicket } from '@/types';
import { bookService } from '@/services/bookService';
import { ticketService } from '@/services/ticketService';
import { HoldTimer } from '@/components/HoldTimer';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BookCoverImage } from '@/components/BookCoverImage';
import {
  Bookmark,
  CheckCircle2,
  XCircle,
  MapPin,
  Barcode,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BookHoldPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const copyIdParam = searchParams.get('copyId');
  const navigate = useNavigate();
  const { user, readerCard } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [ticket, setTicket] = useState<BorrowTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const hasAutoCancelledRef = useRef(false);

  useEffect(() => {
    if (bookId) {
      loadBookAndCopy(bookId);
    }
  }, [bookId, copyIdParam]);

  const loadBookAndCopy = async (bId: string) => {
    setLoading(true);
    try {
      const b = await bookService.getBookById(bId);
      setBook(b);

      const copies = b.copies || [];
      let targetCopy: BookCopy | undefined;

      if (copyIdParam) {
        targetCopy = copies.find((c) => c.id === copyIdParam && c.status === 'AVAILABLE');
      }
      if (!targetCopy) {
        targetCopy = copies.find((c) => c.status === 'AVAILABLE');
      }

      setSelectedCopy(targetCopy || null);
    } catch (err: any) {
      toast.error('Không tìm thấy thông tin cuốn sách!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterHold = async () => {
    if (!selectedCopy) {
      toast.error('Hiện không có bản sao nào khả dụng để đăng ký giữ!');
      return;
    }

    setHolding(true);
    try {
      const cardId = readerCard?.id || readerCard?.cardNumber || 'DG-2024-001';
      const createdTicket = await ticketService.holdBook(selectedCopy.id, cardId);
      setTicket(createdTicket);
      toast.success('Đăng ký giữ sách thành công! Bạn có 5 phút để đến quầy thư viện.');
    } catch (err: any) {
      toast.error(err.message || 'Không thể đăng ký giữ sách.');
    } finally {
      setHolding(false);
    }
  };

  const handleCancelHold = async () => {
    if (!ticket) return;
    if (window.confirm('Bạn có chắc chắn muốn huỷ phiếu giữ sách này?')) {
      try {
        await ticketService.cancelTicket(ticket.id);
        toast.success('Đã huỷ phiếu giữ sách.');
        navigate('/my-tickets');
      } catch (err: any) {
        toast.error('Lỗi khi huỷ: ' + err.message);
      }
    }
  };

  const handleTimerExpired = async () => {
    if (ticket && !hasAutoCancelledRef.current) {
      hasAutoCancelledRef.current = true;
      try {
        await ticketService.cancelTicket(ticket.id);
        toast.error('Thời gian 5 phút giữ sách đã hết! Phiếu giữ đã tự động huỷ.');
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner size="lg" text="Đang khởi tạo phiếu giữ sách..." />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy sách</h3>
        <Link to="/books" className="mt-4 text-primary-600 hover:underline inline-block text-sm">
          Quay lại danh mục sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/books/${book.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chi tiết sách
        </Link>
      </div>

      {/* Main Hold Registration Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {/* Title & Status */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
              <Bookmark className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {ticket ? 'Phiếu Giữ Sách Trực Tuyến Đã Tạo' : 'Xác Nhận Đăng Ký Giữ Sách'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình giữ sách nhanh tại quầy thư viện bằng mã QR Code
              </p>
            </div>
          </div>
        </div>

        {/* Book & Shelf Information Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-24 h-32 overflow-hidden rounded-xl shadow-xs border border-slate-200 flex-shrink-0 bg-slate-100">
            <BookCoverImage
              src={book.coverImage}
              bookId={book.id}
              alt={book.title}
              title={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-2">
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-100 text-primary-800">
              {book.categoryName}
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{book.title}</h3>
            <p className="text-xs text-slate-500">Tác giả: {book.authorName}</p>

            {selectedCopy && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-200/70">
                  <Barcode className="w-4 h-4 text-slate-400" />
                  <span>
                    Mã bản sao: <strong className="font-mono">{selectedCopy.barcode}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-200/70">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <span>
                    Vị trí:{' '}
                    <strong>
                      {selectedCopy.shelfCode} ({selectedCopy.shelfLocation})
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Confirm Hold registration if not yet created */}
        {!ticket ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Info className="w-4 h-4" />
                Lưu ý quan trọng khi giữ sách:
              </div>
              <p>
                1. Sau khi nhấn nút xác nhận, bạn sẽ có đúng <strong>5 phút</strong> để tới quầy thủ thư
                xuất trình mã QR nhận sách.
              </p>
              <p>
                2. Nếu quá 5 phút mà bạn chưa tới nhận sách, hệ thống sẽ <strong>tự động huỷ phiếu</strong>{' '}
                và đưa sách trở lại kệ cho độc giả khác.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={handleRegisterHold}
                disabled={holding || !selectedCopy}
                className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                {holding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang tạo phiếu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận đăng ký giữ sách (5 phút)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Show Ticket with Timer and QR code */
          <div className="space-y-6 pt-2">
            {/* Hold countdown timer */}
            <HoldTimer expiresAt={ticket.holdExpiresAt} onExpire={handleTimerExpired} />

            {/* QR Code and Instructions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <QRCodeDisplay
                  ticketCode={ticket.ticketCode}
                  qrCode={ticket.qrCode}
                  size={190}
                />
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Các bước tiếp theo:
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Đi tới quầy dịch vụ tại: <strong>{selectedCopy?.shelfLocation || 'Tầng 1'}</strong>
                    </li>
                    <li>
                      Đưa màn hình có chứa mã QR hoặc đọc mã phiếu{' '}
                      <strong className="font-mono text-primary-700">{ticket.ticketCode}</strong> cho thủ
                      thư.
                    </li>
                    <li>Thủ thư sẽ quét mã, bàn giao sách và hoàn tất thủ tục mượn.</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => navigate('/my-tickets')}
                    className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition text-center"
                  >
                    Xem danh sách phiếu mượn của tôi
                  </button>
                  <button
                    onClick={handleCancelHold}
                    className="py-2.5 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Huỷ phiếu giữ này
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
