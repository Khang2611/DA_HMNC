import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Shield, Mail, CheckCircle2, AlertCircle, ArrowRight, RotateCw } from 'lucide-react';
import axios from 'axios';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto advance focus
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.verifyEmail({ email, otp: fullOtp });
      if (res.success) {
        setSuccessMessage('Kích hoạt tài khoản thành công! Đang chuyển hướng về trang đăng nhập...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    if (!email) {
      setErrorMessage('Vui lòng nhập email để nhận mã OTP.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await authApi.resendVerification({ email });
      if (res.success) {
        setCountdown(60);
        setSuccessMessage('Mã OTP mới đã được gửi vào email của bạn.');
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.message || 'Không thể gửi lại mã OTP lúc này.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-floating mb-3">
            <div className="w-full h-full bg-brand-surfaceL1 rounded-2xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-brand-secondary" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Xác thực Email kích hoạt</h1>
          <p className="text-xs text-brand-light/60 mt-1">
            Nhập mã OTP 6 số đã được gửi tới hộp thư của bạn
          </p>
        </div>

        <div className="glass-card rounded-2xl p-7">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-financial-error/15 border border-financial-error/30 text-financial-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-financial-success/15 border border-financial-success/30 text-financial-success text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-1">
                Địa chỉ Email nhận mã
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-light/80 mb-2">
                Mã xác thực OTP (6 chữ số)
              </label>
              <div className="flex items-center justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-bold glass-input rounded-xl focus:border-brand-secondary"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="btn-primary w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm mt-3"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  Kích hoạt tài khoản <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend OTP button */}
          <div className="mt-5 pt-4 border-t border-brand-borderSubtle text-center">
            {countdown > 0 ? (
              <span className="text-xs text-brand-light/50">
                Gửi lại mã OTP sau <span className="font-semibold text-brand-secondary">{countdown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-xs font-semibold text-brand-secondary hover:underline inline-flex items-center gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                Gửi lại mã OTP mới
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/login" className="text-xs text-brand-light/60 hover:text-white transition-colors">
            ← Quay lại màn hình Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
