import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, getRoleRedirectPath } = useAuth();

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md text-center glass-card rounded-2xl p-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-financial-error/20 border border-financial-error/30 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-financial-error" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-1">403</h1>
        <h2 className="text-lg font-semibold text-brand-light mb-2">Truy cập bị từ chối</h2>
        <p className="text-xs text-brand-light/60 mb-6">
          Bạn đang đăng nhập với vai trò{' '}
          <span className="font-semibold text-brand-secondary">{user?.role || 'Khách'}</span>. Trang bạn vừa yêu cầu
          yêu cầu đặc quyền cao hơn hoặc thuộc phân hệ nghiệp vụ khác.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
          </button>
          <button
            onClick={() => navigate(getRoleRedirectPath())}
            className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" /> Về trang của tôi
          </button>
        </div>
      </div>
    </div>
  );
};

