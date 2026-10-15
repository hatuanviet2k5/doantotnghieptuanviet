import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 text-2xl font-bold">
          ⛔
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Không có quyền truy cập</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Tài khoản của bạn ({user.role}) không được phép truy cập vào trang này. Vui lòng liên hệ quản trị viên hoặc quay lại trang chủ.
        </p>
        <Navigate to="/books" replace />
      </div>
    );
  }

  return <>{children}</>;
};
