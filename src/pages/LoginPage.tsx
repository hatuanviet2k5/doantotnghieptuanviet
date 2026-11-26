import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { BookOpen, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, Sparkles, Mail, Phone, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/books';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!username.trim() || !password.trim()) {
        setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
        return;
      }

      setLoading(true);
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
      return;
    }

    // Register mode
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ họ tên, tên đăng nhập và mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success('Đăng ký tài khoản độc giả thành công! Vui lòng đăng nhập.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      toast.error(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (u: string, p: string) => {
    setMode('login');
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

        {/* Right column: Login / Register form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-5">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-slate-800">Tuanvietlibrary</span>
            </div>

            {/* Mode switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  mode === 'login' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  mode === 'register' ? 'bg-white text-primary-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Đăng ký độc giả
              </button>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản độc giả'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'login'
                ? 'Nhập mã thẻ độc giả hoặc tên tài khoản để tiếp tục'
                : 'Hệ thống sẽ tự động cấp thẻ thư viện điện tử sau khi đăng ký'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === 'login' ? 'Tài khoản / Mã thẻ độc giả' : 'Tên đăng nhập (MSSV)'}{' '}
                {mode === 'register' && <span className="text-rose-500">*</span>}
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
                  placeholder="admin / librarian / 523100126"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu {mode === 'register' && <span className="text-rose-500">*</span>}
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
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

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 shadow-md shadow-primary-500/20 transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Đang xác thực...' : 'Đang tạo tài khoản...'}</span>
                </>
              ) : mode === 'login' ? (
                'Đăng nhập ngay'
              ) : (
                'Đăng ký & Cấp thẻ độc giả'
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
                onClick={() => handleDemoFill('admin', 'admin123')}
                className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-[11px] font-semibold text-rose-700 transition text-center"
              >
                Quản trị viên
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('librarian', 'lib123')}
                className="px-2.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-[11px] font-semibold text-sky-700 transition text-center"
              >
                Thủ thư
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('523100126', 'pass123')}
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
