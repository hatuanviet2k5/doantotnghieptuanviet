import React, { useState, useEffect } from 'react';
import { User, Role, UserStatus } from '@/types';
import { userService } from '@/services/userService';
import { DataTable, Column } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import {
  Users,
  UserPlus,
  Edit2,
  Lock,
  Unlock,
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'BORROWER' as Role,
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách người dùng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'BORROWER',
      password: 'Password@123',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, form);
        toast.success('Cập nhật người dùng thành công!');
      } else {
        await userService.createUser(form);
        toast.success('Tạo mới người dùng thành công!');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const actionText = user.status === 'ACTIVE' ? 'khoá' : 'mở khoá';
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.username}"?`)) {
      try {
        await userService.toggleUserStatus(user.id);
        toast.success(`Đã ${actionText} tài khoản thành công!`);
        loadUsers();
      } catch (err: any) {
        toast.error('Lỗi: ' + err.message);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns: Column<User>[] = [
    {
      header: 'Tài khoản',
      accessor: 'username',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{u.username}</span>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.id}</p>
        </div>
      ),
    },
    {
      header: 'Họ và tên',
      accessor: 'fullName',
      render: (u) => <span className="font-semibold text-slate-800 text-xs">{u.fullName}</span>,
    },
    {
      header: 'Email / Điện thoại',
      render: (u) => (
        <div className="text-xs">
          <p className="text-slate-800">{u.email}</p>
          <p className="text-slate-400 mt-0.5">{u.phone || 'Chưa cập nhật'}</p>
        </div>
      ),
    },
    {
      header: 'Vai trò (Role)',
      accessor: 'role',
      render: (u) => {
        switch (u.role) {
          case 'ADMIN':
            return (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                ADMIN
              </span>
            );
          case 'LIBRARIAN':
            return (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                LIBRARIAN
              </span>
            );
          case 'BORROWER':
          default:
            return (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                BORROWER
              </span>
            );
        }
      },
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (u) =>
        u.status === 'ACTIVE' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Đã khoá
          </span>
        ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(u)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleStatus(u)}
            className={`p-1.5 rounded-lg transition ${
              u.status === 'ACTIVE'
                ? 'text-rose-500 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
            title={u.status === 'ACTIVE' ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
          >
            {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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
            <Users className="w-6 h-6 text-primary-600" />
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản trị danh sách tài khoản, phân quyền quản trị viên, thủ thư và độc giả
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo username, tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Tất cả vai trò --</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="LIBRARIAN">Thủ thư (LIBRARIAN)</option>
            <option value="BORROWER">Độc giả (BORROWER)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="Không tìm thấy người dùng nào phù hợp"
        pageSize={8}
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Chỉnh sửa tài khoản người dùng' : 'Thêm mới tài khoản người dùng'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                required
                disabled={!!editingUser}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="VD: nguyenvanan"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="an.nguyen@email.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912345678"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phân quyền vai trò
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="BORROWER">Độc giả (BORROWER)</option>
                <option value="LIBRARIAN">Thủ thư (LIBRARIAN)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>

            {!editingUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
