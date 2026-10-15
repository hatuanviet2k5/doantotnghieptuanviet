import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  LayoutDashboard,
  QrCode,
  Layers,
  FileText,
  Users,
  CreditCard,
  ShieldAlert,
  Ticket,
  LogOut,
  Menu,
  X,
  Library,
  User as UserIcon,
  Bell,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Role } from '@/types';

interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: Role[];
}

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: NavItemConfig[] = [
    // General
    { label: 'Danh mục sách', path: '/books', icon: BookOpen },

    // Borrower only
    {
      label: 'Phiếu mượn của tôi',
      path: '/my-tickets',
      icon: Ticket,
      roles: ['BORROWER'],
    },

    // Librarian only or Admin
    {
      label: 'Quét mã QR',
      path: '/qr-verify',
      icon: QrCode,
      roles: ['LIBRARIAN', 'ADMIN'],
    },
    {
      label: 'Quản lý phiếu mượn',
      path: '/tickets',
      icon: FileText,
      roles: ['LIBRARIAN', 'ADMIN'],
    },
    {
      label: 'Quản lý kệ sách',
      path: '/shelves',
      icon: Layers,
      roles: ['LIBRARIAN', 'ADMIN'],
    },

    // Admin & Librarian Dashboard
    {
      label: 'Dashboard & Báo cáo',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'LIBRARIAN'],
    },

    // Admin only
    {
      label: 'Quản lý sách & Bản sao',
      path: '/book-management',
      icon: Library,
      roles: ['ADMIN'],
    },
    {
      label: 'Quản lý người dùng',
      path: '/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      label: 'Thẻ độc giả',
      path: '/reader-cards',
      icon: CreditCard,
      roles: ['ADMIN'],
    },
    {
      label: 'Nhật ký hệ thống',
      path: '/audit-logs',
      icon: ShieldAlert,
      roles: ['ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Quản trị viên
          </span>
        );
      case 'LIBRARIAN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Thủ thư
          </span>
        );
      case 'BORROWER':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Độc giả
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-primary-950 px-4 py-3 text-white border-b border-primary-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-white shadow">
            📚
          </div>
          <span className="font-bold tracking-tight text-white text-base">Tuanvietlibrary</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-primary-900 text-slate-200 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-primary-950 via-primary-900 to-primary-950 text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl md:shadow-none`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-primary-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/30 text-white font-extrabold text-xl">
            📖
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide text-white flex items-center gap-1.5">
              Tuanvietlibrary
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h1>
            <p className="text-[11px] text-primary-300 font-medium tracking-wider uppercase">
              Hệ thống Thư viện số
            </p>
          </div>
        </div>

        {/* User Badge Info inside Sidebar */}
        {user && (
          <div className="mx-4 my-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-700/80 border border-primary-500/40 flex items-center justify-center text-white font-bold">
              <UserIcon className="w-5 h-5 text-primary-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <div className="mt-1 flex items-center gap-2">
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-primary-300 uppercase tracking-wider">
            Menu Chức Năng
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 font-semibold'
                      : 'text-primary-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom user profile & Logout */}
        <div className="p-4 border-t border-primary-800/60 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 border border-rose-500/20 transition duration-150"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              Chào mừng bạn trở lại,{' '}
              <strong className="text-slate-800 font-semibold">{user?.fullName || 'Độc giả'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              {getRoleBadge(user?.role)}
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
