import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Book, BookCopy, BookCopyStatus } from '@/types';
import { bookService } from '@/services/bookService';
import { BookCoverImage } from '@/components/BookCoverImage';
import { SYNC_EVENT_NAME } from '@/services/libraryStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Building,
  Calendar,
  Layers,
  Barcode,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBookDetails(id);
    }

    const handleSync = () => {
      if (id) loadBookDetails(id, false);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
    };
  }, [id]);

  const loadBookDetails = async (bookId: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await bookService.getBookById(bookId);
      setBook(data);
    } catch (err: any) {
      toast.error('Không tìm thấy thông tin cuốn sách này.');
    } finally {
      setLoading(false);
    }
  };

  const handleHoldCopy = (copy: BookCopy) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký giữ sách!');
      navigate('/login');
      return;
    }
    navigate(`/hold/${book?.id}?copyId=${copy.id}`);
  };

  const getCopyStatusBadge = (status: BookCopyStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Có sẵn trên kệ
          </span>
        );
      case 'HOLDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Đang giữ chỗ
          </span>
        );
      case 'BORROWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" />
            Đang được mượn
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Báo mất
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Bảo trì / Phục hồi
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner size="lg" text="Đang tải thông tin chi tiết sách..." />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy sách</h3>
        <Link
          to="/books"
          className="mt-4 inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh mục sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          to="/books"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh mục sách
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Book Cover */}
        <div className="flex justify-center md:justify-start">
          <div className="w-64 max-w-full aspect-[3/4] overflow-hidden rounded-2xl shadow-xl border border-slate-100 bg-slate-100">
            <BookCoverImage
              src={book.coverImage}
              bookId={book.id}
              alt={book.title}
              title={book.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Book Details */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 mb-2">
                {book.categoryName || 'Tài liệu chung'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {book.title}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 font-medium">
                <UserIcon className="w-4 h-4 text-primary-600" />
                <span>Tác giả: </span>
                <span className="text-slate-900 font-bold">{book.authorName || 'Đang cập nhật'}</span>
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Mã số ISBN</p>
                <p className="mt-0.5 text-xs font-mono font-bold text-slate-800">{book.isbn}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Nhà xuất bản</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800 truncate">{book.publisher}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Năm xuất bản</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800">{book.publicationYear}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Tổng số bản</p>
                <p className="mt-0.5 text-xs font-bold text-slate-800">{book.totalCopies} bản</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Khả dụng</p>
                <p className="mt-0.5 text-xs font-bold text-emerald-600">
                  {book.availableCopies} bản có sẵn
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">Giới thiệu nội dung:</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                {book.description || 'Chưa có thông tin tóm tắt cho cuốn sách này.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copies & Shelves Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              Danh sách bản sao & Vị trí trên kệ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu vị trí mã vạch và kệ sách thực tế tại các tầng trong thư viện
            </p>
          </div>

          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            Tổng cộng: {book.copies?.length || 0} bản sao
          </span>
        </div>

        {/* Copies List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Mã vạch (Barcode)</th>
                <th className="px-6 py-3">Vị trí kệ sách</th>
                <th className="px-6 py-3">Tình trạng sách</th>
                <th className="px-6 py-3">Trạng thái mượn</th>
                {hasRole('BORROWER') && <th className="px-6 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {book.copies && book.copies.length > 0 ? (
                book.copies.map((copy) => (
                  <tr key={copy.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                      <div className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-slate-400" />
                        {copy.barcode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-800 rounded font-semibold text-xs">
                          {copy.shelfCode || 'Kệ chính'}
                        </span>
                        <p className="text-xs text-slate-500">{copy.shelfLocation || 'Tầng 1'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{copy.condition}</td>
                    <td className="px-6 py-4">{getCopyStatusBadge(copy.status)}</td>
                    {hasRole('BORROWER') && (
                      <td className="px-6 py-4 text-right">
                        {copy.status === 'AVAILABLE' ? (
                          <button
                            onClick={() => handleHoldCopy(copy)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            Đăng ký giữ sách
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium cursor-not-allowed"
                          >
                            Không khả dụng
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Hiện chưa có bản sao nào được thêm vào cho đầu sách này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
