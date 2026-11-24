import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ChatbotWidget } from '../../components/chat/ChatbotWidget';
import {
  Wallet,
  CreditCard,
  Send,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Sparkles,
  QrCode,
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 relative pb-16">
      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-secondary/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-secondary/20 text-brand-secondary font-semibold border border-brand-secondary/30">
                Hạng: {user?.customerTier || 'STANDARD'}
              </span>
              {user?.kycBiometricVerified ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Sinh trắc học đã xác thực
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                  Chưa xác thực eKYC
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              Xin chào, {user?.fullName || user?.username}!
            </h2>
            <p className="text-xs text-brand-light/60 mt-1">
              Chào mừng bạn đến với Ngân hàng số VinaTrust Bank.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Chuyển tiền ngay
            </button>
            <button className="btn-secondary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Quét VietQR
            </button>
          </div>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Payment Account Card */}
        <div className="glass-card rounded-2xl p-5 border border-brand-borderMauve/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs text-brand-light/70">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-brand-secondary" /> Tài khoản thanh toán
            </span>
            <span className="text-[11px] font-mono text-brand-secondary">VND</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mb-2">
            50,000,000 <span className="text-xs text-brand-light/60 font-normal">₫</span>
          </div>
          <div className="text-[11px] text-brand-light/50 font-mono">
            STK: 1000 0000 8888 • Hoạt động
          </div>
        </div>

        {/* Savings Overview Card */}
        <div className="glass-card rounded-2xl p-5 border border-brand-borderMauve/40">
          <div className="flex items-center justify-between mb-3 text-xs text-brand-light/70">
            <span className="flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-brand-secondary" /> Tiết kiệm tích lũy
            </span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-brand-surfaceL2 text-brand-secondary font-mono">
              6.5%/năm
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mb-2">
            120,000,000 <span className="text-xs text-brand-light/60 font-normal">₫</span>
          </div>
          <div className="text-[11px] text-brand-light/50">
            1 sổ đang gửi • Đáo hạn: 15/12/2026
          </div>
        </div>

        {/* Card Overview Card */}
        <div className="glass-card rounded-2xl p-5 border border-brand-borderMauve/40">
          <div className="flex items-center justify-between mb-3 text-xs text-brand-light/70">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-brand-secondary" /> Thẻ tín dụng VinaTrust
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mb-2">
            30,000,000 <span className="text-xs text-brand-light/60 font-normal">₫</span>
          </div>
          <div className="text-[11px] text-brand-light/50 font-mono">
            Thẻ ảo **** **** **** 8899
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Dịch vụ ngân hàng số</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card rounded-xl p-4 text-center hover:border-brand-secondary/40 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 text-brand-secondary mx-auto flex items-center justify-center mb-2">
              <Send className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-white">Chuyển tiền 24/7</div>
            <div className="text-[10px] text-brand-light/50 mt-0.5">Miễn phí nội bộ & liên ngân hàng</div>
          </div>

          <div className="glass-card rounded-xl p-4 text-center hover:border-brand-secondary/40 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 text-brand-secondary mx-auto flex items-center justify-center mb-2">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-white">Gửi tiết kiệm</div>
            <div className="text-[10px] text-brand-light/50 mt-0.5">Lãi suất cạnh tranh tới 7.2%</div>
          </div>

          <div className="glass-card rounded-xl p-4 text-center hover:border-brand-secondary/40 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 text-brand-secondary mx-auto flex items-center justify-center mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-white">Mở thẻ tức thì</div>
            <div className="text-[10px] text-brand-light/50 mt-0.5">Thẻ ảo kích hoạt sau 30 giây</div>
          </div>

          <div className="glass-card rounded-xl p-4 text-center hover:border-brand-secondary/40 cursor-pointer transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 text-brand-secondary mx-auto flex items-center justify-center mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-white">Khóa thẻ khẩn cấp</div>
            <div className="text-[10px] text-brand-light/50 mt-0.5">Bảo vệ tài khoản tức thời</div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot Widget for Customer */}
      <ChatbotWidget />
    </div>
  );
};

