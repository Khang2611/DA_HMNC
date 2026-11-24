import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Shield, User, Mail, Phone, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (form.username.length < 4 || form.username.length > 50 || /\s/.test(form.username)) {
      return 'Tên đăng nhập từ 4–50 ký tự và không chứa khoảng trắng.';
    }
    if (!form.fullName.trim()) {
      return 'Vui lòng nhập họ và tên.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Địa chỉ email không đúng định dạng.';
    }
    if (!/^(0|\+84)\d{9}$/.test(form.phone)) {
      return 'Số điện thoại Việt Nam không hợp lệ (ví dụ: 0901234567 hoặc +84901234567).';
    }
    if (form.password.length < 8 || form.password.length > 64) {
      return 'Mật khẩu phải từ 8–64 ký tự.';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      return 'Mật khẩu phải bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const valError = validate();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.register({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      if (res.success) {
        // Redirect to verify-email with prefilled email
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.message || 'Đăng ký tài khoản thất bại.');
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 py-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-floating mb-3">
            <div className="w-full h-full bg-brand-surfaceL1 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-brand-secondary" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Đăng ký Tài khoản VinaTrust</h1>
          <p className="text-xs text-brand-light/60 mt-1">Trở thành khách hàng và trải nghiệm dịch vụ ngân hàng số</p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl p-7">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-financial-error/15 border border-financial-error/30 text-financial-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="nguyenvana (4-50 ký tự)"
                  required
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                />
                <User className="w-3.5 h-3.5 text-brand-light/40 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="NGUYỄN VĂN A"
                  required
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                />
                <User className="w-3.5 h-3.5 text-brand-light/40 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-light/80 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@gmail.com"
                    required
                    className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                  />
                  <Mail className="w-3.5 h-3.5 text-brand-light/40 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-light/80 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0901234567"
                    required
                    className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                  />
                  <Phone className="w-3.5 h-3.5 text-brand-light/40 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1">
                Mật khẩu (8–64 ký tự, gồm Hoa, Thường, Số, Ký tự đặc biệt)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                />
                <Lock className="w-3.5 h-3.5 text-brand-light/40 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                />
                <Lock className="w-3.5 h-3.5 text-brand-light/40 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm mt-3"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
                  Đang xử lý đăng ký...
                </>
              ) : (
                <>
                  Tiếp tục xác thực OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-5">
          <p className="text-xs text-brand-light/60">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-brand-secondary hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

