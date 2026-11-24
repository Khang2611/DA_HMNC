import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  CheckSquare,
  ShieldAlert,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building,
  UserCheck,
} from 'lucide-react';

export const LeadApprovalsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-brand-secondary" /> Bàn duyệt Maker-Checker (Trưởng nhóm)
        </h2>
        <p className="text-xs text-brand-light/60 mt-1 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-brand-secondary" />
          Giám sát đội ngũ: <strong className="text-white">{user?.assignedTeam || 'Toàn bộ'}</strong>
        </p>
      </div>

      {/* SLA Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs text-brand-light/60 mb-1">Ca P1 cần phê duyệt</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            0 <span className="text-xs text-emerald-400 font-normal">Đã xử lý hết</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs text-brand-light/60 mb-1">Thời gian phản hồi SLA</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            &lt; 5 <span className="text-xs text-brand-light/60 font-normal">phút</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs text-brand-light/60 mb-1">Tỷ lệ đúng hạn đội</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            99.2%
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">Hàng đợi Phê duyệt P1 trống</h3>
        <p className="text-xs text-brand-light/60 leading-relaxed">
          Hiện tại không có yêu cầu khẩn cấp nào (khóa thẻ vĩnh viễn, phong tỏa tài khoản) cần Trưởng nhóm duyệt.
          Các ca Maker-Checker từ Agent sẽ hiển thị tại đây khi Module Ticket ở <strong>Phần 3</strong> được kích hoạt.
        </p>
      </div>
    </div>
  );
};

