import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Fine, PaymentMethod } from '@/types';
import { fineService } from '@/services/fineService';
import { DataTable, Column } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { DollarSign, CheckCircle2, AlertTriangle, CreditCard, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const FineManagementPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isStaff = hasRole(['ADMIN', 'LIBRARIAN']);

  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    setLoading(true);
    try {
      const data = await fineService.getFines();
      setFines(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách khoản phạt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine) return;
    setPaying(true);
    try {
      await fineService.payFine(selectedFine.id, paymentMethod, selectedFine.amount);
      toast.success('Thanh toán khoản phạt thành công!');
      setSelectedFine(null);
      loadFines();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thanh toán khoản phạt');
    } finally {
      setPaying(false);
    }
  };

  const filteredFines = fines.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (f.ticketCode && f.ticketCode.toLowerCase().includes(q)) ||
      (f.userFullName && f.userFullName.toLowerCase().includes(q));
    const matchesStatus = !statusFilter || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalUnpaid = fines
    .filter((f) => f.status === 'UNPAID')
    .reduce((sum, f) => sum + f.amount, 0);

  const columns: Column<Fine>[] = [
    {
      header: 'Mã phiếu',
      accessor: 'ticketCode',
      render: (f) => (
        <span className="font-mono font-bold text-xs text-primary-900 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
          {f.ticketCode || `#${f.ticketId}`}
        </span>
      ),
    },
    {
      header: 'Độc giả',
      accessor: 'userFullName',
      render: (f) => <span className="font-semibold text-xs text-slate-800">{f.userFullName || 'Độc giả'}</span>,
    },
    {
      header: 'Lý do',
      accessor: 'reason',
      render: (f) => (
        <span className="text-xs text-slate-600">
          {f.reason === 'OVERDUE' ? 'Trả sách quá hạn' : f.reason}
        </span>
      ),
    },
    {
      header: 'Số tiền phạt',
      accessor: 'amount',
      render: (f) => (
        <span className="font-bold text-xs text-rose-600">
          {f.amount.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (f) =>
        f.status === 'PAID' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã thanh toán ({f.paymentMethod || 'CASH'})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Chưa thanh toán
          </span>
        ),
    },
  ];

  if (isStaff) {
    columns.push({
      header: 'Thao tác',
      className: 'text-right',
      render: (f) =>
        f.status === 'UNPAID' ? (
          <button
            onClick={() => {
              setSelectedFine(f);
              setPaymentMethod('CASH');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Thu tiền
          </button>
        ) : (
          <span className="text-xs text-slate-400">Hoàn tất</span>
        ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-600" />
            <span>{isStaff ? 'Quản Lý Khoản Phạt & Thu Phí' : 'Khoản Phạt Của Tôi'}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi phí phạt trễ hạn (5.000đ/ngày/cuốn) và lịch sử thanh toán
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-right">
          <p className="text-[11px] font-semibold text-rose-600 uppercase">Tổng chưa thanh toán</p>
          <p className="text-lg font-extrabold text-rose-700">{totalUnpaid.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu hoặc tên độc giả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
        </select>
      </div>

      <DataTable
        data={filteredFines}
        columns={columns}
        loading={loading}
        emptyMessage="Không có khoản phạt nào."
      />

      {/* Payment modal */}
      <Modal
        isOpen={!!selectedFine}
        onClose={() => setSelectedFine(null)}
        title={`Xác nhận thu tiền phạt - ${selectedFine?.ticketCode || ''}`}
      >
        {selectedFine && (
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p>
                Độc giả: <strong>{selectedFine.userFullName}</strong>
              </p>
              <p>
                Số tiền cần thu:{' '}
                <strong className="text-rose-600 text-base">
                  {selectedFine.amount.toLocaleString('vi-VN')} đ
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phương thức thanh toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="CASH">Tiền mặt tại quầy (CASH)</option>
                <option value="VNPAY">Chuyển khoản VNPAY</option>
                <option value="MOMO">Ví MoMo</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFine(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={paying}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {paying ? 'Đang xử lý...' : 'Xác nhận đã thu'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
