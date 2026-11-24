import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../api/authApi';
import { Shield, Lock, User, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess, getRoleRedirectPath } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsPendingVerification(false);

    try {
      const res = await authApi.login({ identifier: username.trim(), password });
      if (res.success && res.data) {
        const { accessToken, refreshToken, user: userSummary } = res.data;
        // Save token to localStorage immediately so subsequent requests have Authorization header
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        let userProfile: any;
        try {
          const profileRes = await authApi.getMe();
          userProfile = profileRes.data;
        } catch {
          // Fallback to userSummary from login response
          userProfile = {
            id: userSummary.id,
            username: userSummary.username,
            fullName: userSummary.fullName,
            email: userSummary.email,
            phoneNumber: userSummary.phone,
            role: userSummary.role,
            status: userSummary.status,
            kycBiometricVerified: userSummary.kycBiometricVerified ?? false,
            emailVerified: true,
            customerTier: userSummary.customerTier,
            assignedTeam: null,
          };
        }

        loginSuccess(accessToken, refreshToken, userProfile);
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
        const redirectPath = from || getRoleRedirectPath(userProfile.role);
        navigate(redirectPath, { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
        setErrorMessage(msg);

        // Only show verification redirect if the server specifically rejects due to pending verification
        if (msg.toLowerCase().includes('chưa được kích hoạt') || msg.toLowerCase().includes('pending_verification')) {
          setIsPendingVerification(true);
          if (username.includes('@')) {
            setRegisteredEmail(username);
          }
        }
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdmin = () => {
    setUsername('admin1');
    setPassword('VinaTrust@123');
    setErrorMessage(null);
    setIsPendingVerification(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-floating mb-4">
            <div className="w-full h-full bg-brand-surfaceL1 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-brand-secondary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            VinaTrust Bank
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30">
              Web Portal
            </span>
          </h1>
          <p className="text-sm text-brand-light/60 mt-1">Cổng dịch vụ số hợp nhất dành cho Khách hàng & Cán bộ</p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl p-7">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-secondary" /> Đăng nhập hệ thống
          </h2>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-financial-error/15 border border-financial-error/30 text-financial-error text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span>{errorMessage}</span>
                {isPendingVerification && (
                  <div className="mt-2.5 pt-2 border-t border-financial-error/20 flex items-center justify-between">
                    <span className="text-[11px] text-brand-light/80">Tài khoản chưa xác thực email?</span>
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                      className="text-xs font-semibold text-brand-secondary hover:underline flex items-center gap-1"
                    >
                      Kích hoạt ngay <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1.5">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin hoặc email"
                  required
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
                <User className="w-4 h-4 text-brand-light/40 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
                <Lock className="w-4 h-4 text-brand-light/40 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login for Testing */}
          <div className="mt-6 pt-5 border-t border-brand-borderSubtle">
            <div className="flex items-center justify-between text-xs text-brand-light/50 mb-2.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-secondary" /> Điền nhanh tài khoản kiểm thử:
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={fillAdmin}
                className="px-3 py-2 rounded-lg bg-brand-surfaceL2/70 hover:bg-brand-surfaceL2 text-left border border-brand-borderMauve/20 text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white">Quản trị viên (ADMIN)</span>
                  <p className="text-[11px] text-brand-light/50">admin1 / VinaTrust@123</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-brand-secondary opacity-60" />
              </button>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-brand-light/60">
            Chưa có tài khoản khách hàng?{' '}
            <Link to="/register" className="font-semibold text-brand-secondary hover:underline">
              Mở tài khoản trực tuyến ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

