import React, { useState, useEffect } from 'react';
import { Book, Author, Category } from '@/types';
import { bookService } from '@/services/bookService';
import { authorService } from '@/services/authorService';
import { categoryService } from '@/services/categoryService';
import { DataTable, Column } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import {
  Library,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  UserCheck,
  Tag,
  Barcode,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BookManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'books' | 'authors' | 'categories'>('books');

  // Books State
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Book Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    isbn: '',
    authorId: '',
    categoryId: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    description: '',
    coverImage: '',
    totalCopies: 2,
  });

  // Author Modal
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorForm, setAuthorForm] = useState({
    name: '',
    nationality: 'Việt Nam',
    birthYear: 1980,
    biography: '',
  });

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bData, aData, cData] = await Promise.all([
        bookService.getBooks(),
        authorService.getAuthors(),
        categoryService.getCategories(),
      ]);
      setBooks(bData);
      setAuthors(aData);
      setCategories(cData);
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // BOOK HANDLERS
  const openCreateBookModal = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      authorId: authors[0]?.id || '',
      categoryId: categories[0]?.id || '',
      publisher: 'NXB Giáo Dục',
      publicationYear: new Date().getFullYear(),
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      totalCopies: 2,
    });
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (b: Book) => {
    setEditingBook(b);
    setBookForm({
      title: b.title,
      isbn: b.isbn,
      authorId: b.authorId,
      categoryId: b.categoryId,
      publisher: b.publisher,
      publicationYear: b.publicationYear,
      description: b.description || '',
      coverImage: b.coverImage || '',
      totalCopies: b.totalCopies,
    });
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authorObj = authors.find((a) => a.id === bookForm.authorId);
      const catObj = categories.find((c) => c.id === bookForm.categoryId);

      const payload = {
        ...bookForm,
        authorName: authorObj?.name,
        categoryName: catObj?.name,
      };

      if (editingBook) {
        await bookService.updateBook(editingBook.id, payload);
        toast.success('Cập nhật thông tin sách thành công!');
      } else {
        await bookService.createBook(payload);
        toast.success('Thêm mới sách và tạo mã bản sao thành công!');
      }
      setIsBookModalOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thao tác sách');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá đầu sách này cùng các bản sao liên quan?')) {
      try {
        await bookService.deleteBook(id);
        toast.success('Đã xoá sách thành công!');
        loadAll();
      } catch (err: any) {
        toast.error('Lỗi khi xoá: ' + err.message);
      }
    }
  };

  // AUTHOR HANDLERS
  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAuthor) {
        await authorService.updateAuthor(editingAuthor.id, authorForm);
        toast.success('Cập nhật tác giả thành công!');
      } else {
        await authorService.createAuthor(authorForm);
        toast.success('Thêm tác giả thành công!');
      }
      setIsAuthorModalOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thao tác tác giả');
    }
  };

  const handleDeleteAuthor = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá tác giả này?')) {
      try {
        await authorService.deleteAuthor(id);
        toast.success('Đã xoá tác giả!');
        loadAll();
      } catch (err: any) {
        toast.error('Lỗi: ' + err.message);
      }
    }
  };

  // CATEGORY HANDLERS
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await categoryService.updateCategory(editingCat.id, catForm);
        toast.success('Cập nhật thể loại thành công!');
      } else {
        await categoryService.createCategory(catForm);
        toast.success('Thêm thể loại thành công!');
      }
      setIsCatModalOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thao tác thể loại');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá thể loại này?')) {
      try {
        await categoryService.deleteCategory(id);
        toast.success('Đã xoá thể loại!');
        loadAll();
      } catch (err: any) {
        toast.error('Lỗi: ' + err.message);
      }
    }
  };

  const bookColumns: Column<Book>[] = [
    {
      header: 'Bìa sách',
      render: (b) => (
        <img
          src={b.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80'}
          alt={b.title}
          className="w-10 h-14 object-cover rounded-lg border border-slate-200"
        />
      ),
    },
    {
      header: 'Tựa sách & ISBN',
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900 text-xs line-clamp-1">{b.title}</span>
          <p className="font-mono text-[11px] text-slate-400 mt-0.5">ISBN: {b.isbn}</p>
        </div>
      ),
    },
    {
      header: 'Tác giả',
      accessor: 'authorName',
      render: (b) => <span className="text-xs text-slate-700 font-medium">{b.authorName}</span>,
    },
    {
      header: 'Thể loại',
      accessor: 'categoryName',
      render: (b) => (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-50 text-primary-700">
          {b.categoryName}
        </span>
      ),
    },
    {
      header: 'Số bản sao',
      render: (b) => (
        <span className="text-xs font-semibold text-slate-800">
          {b.availableCopies} / {b.totalCopies} sẵn sàng
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditBookModal(b)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Chỉnh sửa sách"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteBook(b.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            title="Xoá sách"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const authorColumns: Column<Author>[] = [
    {
      header: 'Tên tác giả',
      accessor: 'name',
      render: (a) => <span className="font-bold text-xs text-slate-800">{a.name}</span>,
    },
    {
      header: 'Quốc tịch',
      accessor: 'nationality',
      render: (a) => <span className="text-xs text-slate-600">{a.nationality || 'Chưa cập nhật'}</span>,
    },
    {
      header: 'Năm sinh',
      accessor: 'birthYear',
      render: (a) => <span className="text-xs text-slate-600">{a.birthYear || '-'}</span>,
    },
    {
      header: 'Tiểu sử tóm tắt',
      accessor: 'biography',
      render: (a) => (
        <span className="text-xs text-slate-500 line-clamp-1 max-w-md">{a.biography || '-'}</span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingAuthor(a);
              setAuthorForm({
                name: a.name,
                nationality: a.nationality || 'Việt Nam',
                birthYear: a.birthYear || 1980,
                biography: a.biography || '',
              });
              setIsAuthorModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAuthor(a.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const catColumns: Column<Category>[] = [
    {
      header: 'Mã thể loại',
      accessor: 'code',
      render: (c) => (
        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-800">
          {c.code}
        </span>
      ),
    },
    {
      header: 'Tên danh mục thể loại',
      accessor: 'name',
      render: (c) => <span className="font-bold text-xs text-slate-800">{c.name}</span>,
    },
    {
      header: 'Mô tả',
      accessor: 'description',
      render: (c) => (
        <span className="text-xs text-slate-500 line-clamp-1 max-w-md">{c.description || '-'}</span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingCat(c);
              setCatForm({
                name: c.name,
                code: c.code,
                description: c.description || '',
              });
              setIsCatModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteCategory(c.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
            <Library className="w-6 h-6 text-primary-600" />
            <span>Quản Trị Kho Sách & Metadata</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý toàn bộ danh mục tài liệu, tác giả và phân loại chủ đề sách trong thư viện
          </p>
        </div>

        {/* Add button depending on tab */}
        {activeTab === 'books' && (
          <button
            onClick={openCreateBookModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm đầu sách mới
          </button>
        )}
        {activeTab === 'authors' && (
          <button
            onClick={() => {
              setEditingAuthor(null);
              setAuthorForm({ name: '', nationality: 'Việt Nam', birthYear: 1980, biography: '' });
              setIsAuthorModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm tác giả mới
          </button>
        )}
        {activeTab === 'categories' && (
          <button
            onClick={() => {
              setEditingCat(null);
              setCatForm({ name: '', code: `CAT-${Date.now().toString().slice(-3)}`, description: '' });
              setIsCatModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm thể loại mới
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition ${
            activeTab === 'books'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Danh sách Sách ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('authors')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition ${
            activeTab === 'authors'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Danh sách Tác giả ({authors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition ${
            activeTab === 'categories'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Danh mục Thể loại ({categories.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'books' && (
        <DataTable
          columns={bookColumns}
          data={books}
          loading={loading}
          emptyMessage="Không có sách nào"
          pageSize={8}
        />
      )}

      {activeTab === 'authors' && (
        <DataTable
          columns={authorColumns}
          data={authors}
          loading={loading}
          emptyMessage="Không có tác giả nào"
          pageSize={8}
        />
      )}

      {activeTab === 'categories' && (
        <DataTable
          columns={catColumns}
          data={categories}
          loading={loading}
          emptyMessage="Không có thể loại nào"
          pageSize={8}
        />
      )}

      {/* Book Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={editingBook ? 'Chỉnh sửa thông tin sách' : 'Thêm mới đầu sách'}
        size="lg"
      >
        <form onSubmit={handleSaveBook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên tựa sách</label>
            <input
              type="text"
              required
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              placeholder="VD: Clean Code"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số ISBN</label>
              <input
                type="text"
                required
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                placeholder="VD: 978-0132350884"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số lượng bản sao khởi tạo
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                disabled={!!editingBook}
                value={bookForm.totalCopies}
                onChange={(e) =>
                  setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tác giả</label>
              <select
                required
                value={bookForm.authorId}
                onChange={(e) => setBookForm({ ...bookForm, authorId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thể loại</label>
              <select
                required
                value={bookForm.categoryId}
                onChange={(e) => setBookForm({ ...bookForm, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nhà xuất bản</label>
              <input
                type="text"
                required
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                placeholder="VD: NXB Trẻ"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Năm xuất bản</label>
              <input
                type="number"
                required
                value={bookForm.publicationYear}
                onChange={(e) =>
                  setBookForm({ ...bookForm, publicationYear: parseInt(e.target.value) || 2024 })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link ảnh bìa sách (URL)
            </label>
            <input
              type="url"
              value={bookForm.coverImage}
              onChange={(e) => setBookForm({ ...bookForm, coverImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả tóm tắt nội dung</label>
            <textarea
              rows={3}
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              placeholder="Tóm tắt nội dung sách..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              {editingBook ? 'Lưu thay đổi' : 'Thêm sách mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Author Modal */}
      <Modal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        title={editingAuthor ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
      >
        <form onSubmit={handleSaveAuthor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên tác giả</label>
            <input
              type="text"
              required
              value={authorForm.name}
              onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
              placeholder="VD: Dale Carnegie"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quốc tịch</label>
              <input
                type="text"
                value={authorForm.nationality}
                onChange={(e) => setAuthorForm({ ...authorForm, nationality: e.target.value })}
                placeholder="VD: Việt Nam"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Năm sinh</label>
              <input
                type="number"
                value={authorForm.birthYear}
                onChange={(e) =>
                  setAuthorForm({ ...authorForm, birthYear: parseInt(e.target.value) || 1980 })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tiểu sử</label>
            <textarea
              rows={3}
              value={authorForm.biography}
              onChange={(e) => setAuthorForm({ ...authorForm, biography: e.target.value })}
              placeholder="Giới thiệu về tác giả..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAuthorModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Lưu tác giả
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã thể loại</label>
              <input
                type="text"
                required
                value={catForm.code}
                onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                placeholder="VD: CNTT"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thể loại</label>
              <input
                type="text"
                required
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="VD: Lập trình di động"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả</label>
            <textarea
              rows={3}
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="Mô tả thể loại..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Lưu thể loại
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
