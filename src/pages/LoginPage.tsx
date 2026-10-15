import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/books';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(username, password);
      toast.success('Đăng nhập thành công! Chào mừng bạn quay trở lại.');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
      toast.error(err.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md sm:max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 grid grid-cols-1 md:grid-cols-2">
        {/* Left column: Visual hero */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-950 text-white relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/20">
              📚
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight leading-tight">
              Tuanvietlibrary - Hệ Thống Quản Lý Thư Viện Số Hiện Đại
            </h2>
            <p className="mt-3 text-sm text-primary-100 leading-relaxed">
              Tra cứu sách trực tuyến, đăng ký giữ sách với mã QR tức thì, và theo dõi mượn trả dễ dàng, thông minh.
            </p>
          </div>

          {/* Feature list */}
          <div className="relative z-10 space-y-3 py-6 border-y border-white/10">
            <div className="flex items-center gap-2.5 text-xs text-primary-100 font-medium">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Đăng ký giữ sách trực tuyến (Hold 5 phút)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-primary-100 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Xác thực mượn/trả nhanh chóng qua QR Code</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-primary-100 font-medium">
              <BookOpen className="w-4 h-4 text-sky-300" />
              <span>Quản lý vị trí sách theo tầng & kệ thông minh</span>
            </div>
          </div>

          <div className="relative z-10 text-xs text-primary-300">
            © 2026 Tuanvietlibrary - Bản quyền thuộc Trung tâm Thư Viện
          </div>
        </div>

        {/* Right column: Login form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-slate-800">Tuanvietlibrary</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Đăng nhập</h3>
            <p className="mt-1 text-xs text-slate-500">
              Nhập mã thẻ độc giả hoặc tên tài khoản để tiếp tục
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tài khoản / Mã thẻ độc giả
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / librarian / borrower"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 shadow-md shadow-primary-500/20 transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                'Đăng nhập ngay'
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Tài khoản dùng thử nhanh:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin', '123456')}
                className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-[11px] font-semibold text-rose-700 transition text-center"
              >
                Quản trị viên
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('librarian', '123456')}
                className="px-2.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-[11px] font-semibold text-sky-700 transition text-center"
              >
                Thủ thư
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('borrower', '123456')}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-700 transition text-center"
              >
                Độc giả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
