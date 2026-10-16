import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Category, Author } from '@/types';
import { bookService } from '@/services/bookService';
import { categoryService } from '@/services/categoryService';
import { authorService } from '@/services/authorService';
import { BookCard } from '@/components/BookCard';
import { BookCoverImage } from '@/components/BookCoverImage';
import { SYNC_EVENT_NAME } from '@/services/libraryStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  BookOpen,
  Bookmark,
  CheckCircle2,
  XCircle,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BookListPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadInitialData();

    const handleSync = () => {
      loadInitialData(false);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
    };
  }, []);

  const loadInitialData = async (showLoading: boolean | any = true) => {
    const shouldShow = typeof showLoading === 'boolean' ? showLoading : true;
    if (shouldShow) setLoading(true);
    try {
      const [booksRes, catsRes, authorsRes] = await Promise.all([
        bookService.getBooks(),
        categoryService.getCategories(),
        authorService.getAuthors(),
      ]);
      setBooks(booksRes);
      setCategories(catsRes);
      setAuthors(authorsRes);
    } catch (err: any) {
      toast.error('Không thể tải danh sách sách: ' + err.message);
    } finally {
      if (shouldShow) setLoading(false);
    }
  };

  const handleHold = (book: Book) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký mượn sách!');
      navigate('/login');
      return;
    }
    // Navigate to hold confirmation page with bookId
    navigate(`/hold/${book.id}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setAvailabilityFilter('all');
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.authorName && book.authorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || book.categoryId === selectedCategory;
    const matchesAuthor = !selectedAuthor || book.authorId === selectedAuthor;
    const matchesAvailability =
      availabilityFilter === 'all' || (availabilityFilter === 'available' && book.availableCopies > 0);

    return matchesSearch && matchesCategory && matchesAuthor && matchesAvailability;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tra cứu & Mượn sách</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
              {filteredBooks.length} cuốn
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khám phá kho sách phong phú, kiểm tra vị trí trên kệ và đăng ký giữ sách trực tuyến
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition text-xs font-medium flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Dạng lưới"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Lưới</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition text-xs font-medium flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Dạng danh sách"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sách, ISBN, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Tất cả danh mục thể loại --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author dropdown */}
          <div>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Tất cả tác giả --</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability filter & Reset */}
          <div className="flex items-center gap-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="available">Chỉ sách đang còn sẵn</option>
            </select>

            {(searchQuery || selectedCategory || selectedAuthor || availabilityFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition"
                title="Xoá bộ lọc"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Book Catalog Results */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" text="Đang tải danh mục sách..." />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Không tìm thấy sách phù hợp</h3>
          <p className="mt-1 text-sm text-slate-500">
            Thử thay đổi từ khoá tìm kiếm hoặc đặt lại các bộ lọc bên trên.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại bộ lọc
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onHold={handleHold}
              showHoldButton={hasRole('BORROWER')}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-22 overflow-hidden rounded-xl shadow-xs border border-slate-200 flex-shrink-0 bg-slate-100">
                    <BookCoverImage
                      src={book.coverImage}
                      bookId={book.id}
                      alt={book.title}
                      title={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => navigate(`/books/${book.id}`)}
                      className="text-left font-bold text-slate-900 hover:text-primary-600 transition text-base line-clamp-1"
                    >
                      {book.title}
                    </button>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {book.authorName}
                      </span>
                      <span>•</span>
                      <span>ISBN: {book.isbn}</span>
                      <span>•</span>
                      <span className="text-primary-700 font-medium">{book.categoryName}</span>
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">{book.description}</p>
                  </div>
                </div>

                {/* Right badges & buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                  <div>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Còn {book.availableCopies} / {book.totalCopies} cuốn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Đã hết sách
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/books/${book.id}`)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                    >
                      Chi tiết
                    </button>
                    {hasRole('BORROWER') && (
                      <button
                        onClick={() => handleHold(book)}
                        disabled={!isAvailable}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl transition shadow-xs flex items-center gap-1"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        Giữ sách
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
