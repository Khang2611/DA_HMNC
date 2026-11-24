import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  Headphones,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  User,
  Building,
  Sparkles,
} from 'lucide-react';

export const AgentTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'P1' | 'P2' | 'P3' | 'P4'>('ALL');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-brand-secondary" /> Hàng đợi Ticket — Bàn làm việc Chuyên viên
          </h2>
          <p className="text-xs text-brand-light/60 mt-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-brand-secondary" />
            Đội tiếp nhận: <strong className="text-white">{user?.assignedTeam || 'Chưa phân bổ'}</strong>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-borderSubtle pb-2">
        {(['ALL', 'P1', 'P2', 'P3', 'P4'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              priorityFilter === p
                ? 'bg-brand-secondary/20 text-white border border-brand-secondary/40'
                : 'text-brand-light/60 hover:text-white'
            }`}
          >
            {p === 'ALL' ? 'Tất cả mức độ' : `Ưu tiên ${p}`}
          </button>
        ))}
      </div>

      {/* Empty State / Ready for Part 3 Ticket Module */}
      <div className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-brand-surfaceL2 border border-brand-borderMauve/30 flex items-center justify-center mx-auto mb-4 text-brand-secondary">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">Hàng đợi Ticket Đội đã sẵn sàng</h3>
        <p className="text-xs text-brand-light/60 leading-relaxed mb-6">
          Bàn làm việc của chuyên viên thuộc đội <strong>"{user?.assignedTeam || 'Chung'}"</strong> đã được thiết lập.
          Hệ thống đang sẵn sàng kết nối Module Ticket ở <strong>Phần 3</strong> để tự động nhận gói bàn giao từ AI Chatbot.
        </p>

        <div className="p-3.5 rounded-xl bg-brand-surfaceL2/80 border border-brand-borderSubtle text-left text-xs text-brand-light/70 space-y-1.5">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <FileText className="w-3.5 h-3.5 text-brand-secondary" /> Gói bàn giao AI Handover (Preview):
          </div>
          <p className="text-[11px] text-brand-light/50">
            • Tự động đính kèm tóm tắt hội thoại của khách hàng với AI.
          </p>
          <p className="text-[11px] text-brand-light/50">
            • Tự động trích xuất ý định (Intent), mức độ ưu tiên (P1-P4) và lịch sử giao dịch liên quan.
          </p>
        </div>
      </div>
    </div>
  );
};

