import React, { useState, useEffect } from 'react';
import { Shelf, BookCopy, BookCopyStatus, Book } from '@/types';
import { shelfService } from '@/services/shelfService';
import { bookService } from '@/services/bookService';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Barcode,
  BookOpen,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ShelfMgmtPage: React.FC = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [shelfForm, setShelfForm] = useState({
    code: '',
    name: '',
    location: '',
    capacity: 100,
    description: '',
  });

  // Selected shelf for copies viewer
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [shelfCopies, setShelfCopies] = useState<BookCopy[]>([]);
  const [loadingCopies, setLoadingCopies] = useState(false);

  // Add copy modal
  const [isAddCopyModalOpen, setIsAddCopyModalOpen] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [copyForm, setCopyForm] = useState({
    bookId: '',
    barcode: '',
    condition: 'Mới 100%',
    status: 'AVAILABLE' as BookCopyStatus,
  });

  useEffect(() => {
    loadShelves();
    loadBooks();
  }, []);

  const loadShelves = async () => {
    setLoading(true);
    try {
      const data = await shelfService.getShelves();
      setShelves(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách kệ sách: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const books = await bookService.getBooks();
      setAvailableBooks(books);
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateShelfModal = () => {
    setEditingShelf(null);
    setShelfForm({
      code: `KE-${String.fromCharCode(65 + shelves.length)}${shelves.length + 1}`,
      name: '',
      location: 'Tầng 1 - Phòng A101',
      capacity: 100,
      description: '',
    });
    setIsShelfModalOpen(true);
  };

  const openEditShelfModal = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setShelfForm({
      code: shelf.code,
      name: shelf.name,
      location: shelf.location,
      capacity: shelf.capacity,
      description: shelf.description || '',
    });
    setIsShelfModalOpen(true);
  };

  const handleSaveShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShelf) {
        await shelfService.updateShelf(editingShelf.id, shelfForm);
        toast.success('Cập nhật kệ sách thành công!');
      } else {
        await shelfService.createShelf(shelfForm);
        toast.success('Thêm mới kệ sách thành công!');
      }
      setIsShelfModalOpen(false);
      loadShelves();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi thao tác kệ sách');
    }
  };

  const handleDeleteShelf = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá kệ sách này?')) {
      try {
        await shelfService.deleteShelf(id);
        toast.success('Đã xoá kệ sách thành công!');
        if (selectedShelf?.id === id) {
          setSelectedShelf(null);
        }
        loadShelves();
      } catch (err: any) {
        toast.error('Lỗi khi xoá: ' + err.message);
      }
    }
  };

  const handleViewCopies = async (shelf: Shelf) => {
    setSelectedShelf(shelf);
    setLoadingCopies(true);
    try {
      const copies = await shelfService.getCopiesByShelf(shelf.id);
      setShelfCopies(copies);
    } catch (err: any) {
      toast.error('Không thể tải bản sao trên kệ: ' + err.message);
    } finally {
      setLoadingCopies(false);
    }
  };

  const handleUpdateCopyStatus = async (copyId: string, status: BookCopyStatus) => {
    try {
      await shelfService.updateCopyStatus(copyId, status);
      toast.success('Đã cập nhật trạng thái bản sao!');
      if (selectedShelf) {
        handleViewCopies(selectedShelf);
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleAddCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelf) return;
    try {
      const selectedBook = availableBooks.find((b) => b.id === copyForm.bookId);
      await shelfService.addCopyToShelf(selectedShelf.id, {
        bookId: copyForm.bookId,
        bookTitle: selectedBook?.title || 'Sách mới',
        barcode: copyForm.barcode || `BC-${Date.now().toString().slice(-6)}`,
        condition: copyForm.condition,
        status: copyForm.status,
      });
      toast.success('Đã thêm bản sao vào kệ thành công!');
      setIsAddCopyModalOpen(false);
      handleViewCopies(selectedShelf);
      loadShelves();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm bản sao');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            <span>Quản Lý Kệ Sách & Bản Sao</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý vị trí lưu trữ, sức chứa kệ sách và tình trạng các bản sao trong kho
          </p>
        </div>

        <button
          onClick={openCreateShelfModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Thêm kệ sách mới
        </button>
      </div>

      {/* Shelves Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" text="Đang tải danh sách kệ sách..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {shelves.map((shelf) => {
            const usagePercent = Math.min(
              100,
              Math.round((shelf.currentUsage / (shelf.capacity || 1)) * 100)
            );
            const isFull = usagePercent >= 90;
            const isSelected = selectedShelf?.id === shelf.id;

            return (
              <div
                key={shelf.id}
                className={`relative bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-primary-50 text-primary-700">
                      {shelf.code}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900 line-clamp-1">
                      {shelf.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditShelfModal(shelf)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                      title="Chỉnh sửa kệ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteShelf(shelf.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Xoá kệ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{shelf.location}</span>
                </div>

                {/* Capacity Progress */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Sức chứa:</span>
                    <span className="font-semibold text-slate-800">
                      {shelf.currentUsage} / {shelf.capacity} cuốn ({usagePercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* View copies action */}
                <button
                  onClick={() => handleViewCopies(shelf)}
                  className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isSelected ? 'Đang xem bản sao' : 'Xem các cuốn trên kệ'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Shelf Copies Detail Table */}
      {selectedShelf && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Danh sách bản sao trên {selectedShelf.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-800">
                  {selectedShelf.code}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vị trí: {selectedShelf.location} | Sức chứa hiện tại: {shelfCopies.length} bản sao
              </p>
            </div>

            <button
              onClick={() => {
                setCopyForm({
                  bookId: availableBooks[0]?.id || '',
                  barcode: `BC-${selectedShelf.code}-${Date.now().toString().slice(-4)}`,
                  condition: 'Mới 100%',
                  status: 'AVAILABLE',
                });
                setIsAddCopyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
            >
              <FolderPlus className="w-4 h-4" />
              Thêm bản sao vào kệ này
            </button>
          </div>

          {loadingCopies ? (
            <div className="py-12">
              <LoadingSpinner size="md" text="Đang tải dữ liệu bản sao..." />
            </div>
          ) : shelfCopies.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Kệ sách này hiện chưa có bản sao nào. Nhấn "Thêm bản sao vào kệ này" để bổ sung sách.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mã vạch (Barcode)</th>
                    <th className="px-5 py-3">Tựa sách</th>
                    <th className="px-5 py-3">Tình trạng vật lý</th>
                    <th className="px-5 py-3">Trạng thái mượn</th>
                    <th className="px-5 py-3 text-right">Chuyển trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shelfCopies.map((copy) => (
                    <tr key={copy.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-xs text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-slate-400" />
                          {copy.barcode}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-xs text-slate-800">
                        {copy.bookTitle || 'Sách'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{copy.condition}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            copy.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : copy.status === 'BORROWED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : copy.status === 'HOLDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {copy.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={copy.status}
                          onChange={(e) =>
                            handleUpdateCopyStatus(copy.id, e.target.value as BookCopyStatus)
                          }
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="AVAILABLE">AVAILABLE (Có sẵn)</option>
                          <option value="HOLDING">HOLDING (Giữ chỗ)</option>
                          <option value="BORROWED">BORROWED (Đang mượn)</option>
                          <option value="LOST">LOST (Báo mất)</option>
                          <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Shelf Modal */}
      <Modal
        isOpen={isShelfModalOpen}
        onClose={() => setIsShelfModalOpen(false)}
        title={editingShelf ? 'Chỉnh sửa thông tin kệ sách' : 'Thêm kệ sách mới'}
      >
        <form onSubmit={handleSaveShelf} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã kệ sách</label>
              <input
                type="text"
                required
                value={shelfForm.code}
                onChange={(e) => setShelfForm({ ...shelfForm, code: e.target.value })}
                placeholder="VD: KE-A1"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sức chứa tối đa (cuốn)
              </label>
              <input
                type="number"
                required
                min="1"
                value={shelfForm.capacity}
                onChange={(e) =>
                  setShelfForm({ ...shelfForm, capacity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên kệ sách</label>
            <input
              type="text"
              required
              value={shelfForm.name}
              onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
              placeholder="VD: Kệ A1 - CNTT & Phần Mềm"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vị trí thực tế trong thư viện
            </label>
            <input
              type="text"
              required
              value={shelfForm.location}
              onChange={(e) => setShelfForm({ ...shelfForm, location: e.target.value })}
              placeholder="VD: Tầng 1 - Khu A - Phòng A101"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Ghi chú</label>
            <textarea
              rows={3}
              value={shelfForm.description}
              onChange={(e) => setShelfForm({ ...shelfForm, description: e.target.value })}
              placeholder="Ghi chú về thể loại tài liệu được sắp xếp tại kệ này..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsShelfModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              {editingShelf ? 'Lưu thay đổi' : 'Thêm kệ mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Copy Modal */}
      <Modal
        isOpen={isAddCopyModalOpen}
        onClose={() => setIsAddCopyModalOpen(false)}
        title={`Thêm bản sao vào kệ ${selectedShelf?.code}`}
      >
        <form onSubmit={handleAddCopySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn đầu sách</label>
            <select
              required
              value={copyForm.bookId}
              onChange={(e) => setCopyForm({ ...copyForm, bookId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (ISBN: {b.isbn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã vạch (Barcode)</label>
            <input
              type="text"
              required
              value={copyForm.barcode}
              onChange={(e) => setCopyForm({ ...copyForm, barcode: e.target.value })}
              placeholder="VD: BC-CC-001"
              className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tình trạng</label>
              <input
                type="text"
                required
                value={copyForm.condition}
                onChange={(e) => setCopyForm({ ...copyForm, condition: e.target.value })}
                placeholder="VD: Mới 100%"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={copyForm.status}
                onChange={(e) =>
                  setCopyForm({ ...copyForm, status: e.target.value as BookCopyStatus })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="AVAILABLE">AVAILABLE (Có sẵn)</option>
                <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddCopyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Thêm bản sao
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
