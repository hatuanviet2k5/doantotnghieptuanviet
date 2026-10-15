import React, { useState, useEffect } from 'react';
import { ReaderCard, ReaderCardStatus, User } from '@/types';
import { readerCardService } from '@/services/readerCardService';
import { userService } from '@/services/userService';
import { DataTable, Column } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import {
  CreditCard,
  Plus,
  CheckCircle,
  AlertOctagon,
  Calendar,
  UserCheck,
  Eye,
  Search,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReaderCardPage: React.FC = () => {
  const [cards, setCards] = useState<ReaderCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Issue Card
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    userId: '',
    maxBorrowLimit: 5,
  });

  // Modal View Card
  const [selectedCard, setSelectedCard] = useState<ReaderCard | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    loadCards();
    loadUsers();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await readerCardService.getReaderCards();
      setCards(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách thẻ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getUsers();
      setUsers(allUsers.filter((u) => u.role === 'BORROWER'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.userId) {
      toast.error('Vui lòng chọn người dùng!');
      return;
    }

    try {
      await readerCardService.issueReaderCard(issueForm);
      toast.success('Cấp thẻ độc giả mới thành công!');
      setIsIssueModalOpen(false);
      loadCards();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cấp thẻ');
    }
  };

  const handleToggleCardStatus = async (card: ReaderCard) => {
    const newStatus: ReaderCardStatus = card.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const action = newStatus === 'SUSPENDED' ? 'tạm ngưng' : 'kích hoạt lại';

    if (window.confirm(`Bạn có chắc chắn muốn ${action} thẻ độc giả "${card.cardNumber}"?`)) {
      try {
        await readerCardService.updateCardStatus(card.id, newStatus);
        toast.success(`Đã ${action} thẻ thành công!`);
        loadCards();
      } catch (err: any) {
        toast.error('Lỗi: ' + err.message);
      }
    }
  };

  const filteredCards = cards.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.cardNumber.toLowerCase().includes(q) ||
      (c.userFullName && c.userFullName.toLowerCase().includes(q))
    );
  });

  const columns: Column<ReaderCard>[] = [
    {
      header: 'Số thẻ (Card ID)',
      accessor: 'cardNumber',
      render: (c) => (
        <span className="font-mono font-bold text-xs text-primary-900 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
          {c.cardNumber}
        </span>
      ),
    },
    {
      header: 'Họ tên độc giả',
      accessor: 'userFullName',
      render: (c) => (
        <div>
          <span className="font-bold text-slate-800 text-xs">{c.userFullName || 'Chưa cập nhật'}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">UID: {c.userId}</p>
        </div>
      ),
    },
    {
      header: 'Ngày phát hành / Hết hạn',
      render: (c) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <p>Cấp: {c.issueDate}</p>
          <p className="text-slate-400">Hết hạn: {c.expiryDate}</p>
        </div>
      ),
    },
    {
      header: 'Đang mượn / Giới hạn',
      render: (c) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{c.currentBorrowCount}</span>
          <span className="text-slate-400"> / {c.maxBorrowLimit} cuốn</span>
        </div>
      ),
    },
    {
      header: 'Trạng thái thẻ',
      accessor: 'status',
      render: (c) => {
        switch (c.status) {
          case 'ACTIVE':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                Hoạt động
              </span>
            );
          case 'SUSPENDED':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertOctagon className="w-3.5 h-3.5" />
                Tạm ngưng
              </span>
            );
          case 'EXPIRED':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertOctagon className="w-3.5 h-3.5" />
                Đã hết hạn
              </span>
            );
        }
      },
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setSelectedCard(c);
              setIsViewModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition"
            title="Xem thẻ mẫu"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleCardStatus(c)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              c.status === 'ACTIVE'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {c.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
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
            <CreditCard className="w-6 h-6 text-primary-600" />
            <span>Quản Lý Thẻ Độc Giả</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cấp phát thẻ thư viện mới, gia hạn niên khóa và quản lý quyền hạn mượn sách
          </p>
        </div>

        <button
          onClick={() => {
            setIssueForm({
              userId: users[0]?.id || '',
              maxBorrowLimit: 5,
            });
            setIsIssueModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cấp thẻ độc giả mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo số thẻ hoặc họ tên độc giả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent focus:outline-none text-slate-800"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCards}
        loading={loading}
        emptyMessage="Không tìm thấy thẻ độc giả nào"
        pageSize={8}
      />

      {/* Modal Issue New Card */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Cấp thẻ độc giả mới"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn độc giả cần cấp thẻ
            </label>
            <select
              required
              value={issueForm.userId}
              onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn độc giả --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.username} - {u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giới hạn số lượng sách mượn cùng lúc
            </label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={issueForm.maxBorrowLimit}
              onChange={(e) =>
                setIssueForm({ ...issueForm, maxBorrowLimit: parseInt(e.target.value) || 5 })
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Mặc định: 5 cuốn. Thời hạn thẻ sẽ tự động tính 1 năm kể từ ngày cấp.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Xác nhận cấp thẻ
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal View Digital Card Preview */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Thẻ Độc Giả Điện Tử"
      >
        {selectedCard && (
          <div className="p-2 space-y-4">
            {/* Visual Card Mockup */}
            <div className="w-full aspect-[1.58/1] rounded-2xl bg-gradient-to-tr from-primary-950 via-primary-900 to-indigo-900 text-white p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-white/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <span className="font-bold text-xs tracking-wider uppercase text-primary-200">
                      TUANVIETLIBRARY
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold tracking-tight">THẺ ĐỘC GIẢ</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-primary-300">TRẠNG THÁI</span>
                  <p className="text-xs font-bold text-emerald-400">{selectedCard.status}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-primary-300 uppercase">Họ và tên độc giả</span>
                <h4 className="text-xl font-bold tracking-wide">{selectedCard.userFullName}</h4>
              </div>

              <div className="flex items-end justify-between border-t border-white/10 pt-3">
                <div>
                  <span className="text-[10px] text-primary-300 uppercase">Mã số thẻ</span>
                  <p className="font-mono text-base font-black tracking-wider text-amber-300">
                    {selectedCard.cardNumber}
                  </p>
                </div>
                <div className="text-right text-[11px] text-primary-200">
                  <p>Hạn: {selectedCard.expiryDate}</p>
                  <p>Hạn mức: {selectedCard.maxBorrowLimit} cuốn</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
