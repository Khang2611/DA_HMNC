import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../auth/AuthContext';
import { UserProfile, Role, UserStatus } from '../../types/api';
import {
  Users,
  Search,
  Filter,
  Shield,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  UserCheck,
  Building,
} from 'lucide-react';
import axios from 'axios';

const SUPPORT_TEAMS = [
  'An ninh và gian lận',
  'Chuyển tiền và tra soát',
  'Thẻ và thanh toán',
  'Ngân hàng số',
  'Tài khoản',
  'Chăm sóc chung',
];

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal update role state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<Role>('CUSTOMER');
  const [newTeam, setNewTeam] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        size,
        role: selectedRole,
        keyword,
      });
      if (res.success && res.data) {
        setUsers(res.data.content);
        setTotalElements(res.data.totalElements);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Fetch users error', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, selectedRole, keyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setNewRole(user.role);
    setNewTeam(user.assignedTeam || SUPPORT_TEAMS[0]);
    setModalError(null);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setModalError(null);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if ((newRole === 'AGENT' || newRole === 'TEAM_LEAD') && !newTeam) {
      setModalError('Vai trò Nhân viên (Agent) và Trưởng nhóm (Lead) bắt buộc phải chọn Đội phụ trách.');
      return;
    }

    setIsUpdating(true);
    setModalError(null);

    try {
      const res = await adminApi.updateUserRole(editingUser.id, {
        role: newRole,
        assignedTeam: (newRole === 'AGENT' || newRole === 'TEAM_LEAD') ? newTeam : null,
      });

      if (res.success) {
        setToastMessage({
          text: `Đã cập nhật vai trò ${editingUser.fullName} thành ${newRole}. Token cũ của người dùng này đã bị thu hồi để đảm bảo an toàn.`,
          type: 'success',
        });
        handleCloseEdit();
        fetchUsers();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setModalError(err.response?.data?.message || 'Cập nhật vai trò thất bại.');
      } else {
        setModalError('Lỗi kết nối máy chủ.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">ADMIN</span>;
      case 'TEAM_LEAD':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">TEAM_LEAD</span>;
      case 'AGENT':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">AGENT</span>;
      case 'CUSTOMER':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">CUSTOMER</span>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Hoạt động</span>;
      case 'PENDING_VERIFICATION':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Chờ OTP</span>;
      case 'LOCKED':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">Đã khóa</span>;
      case 'SUSPENDED':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-medium">Đình chỉ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          toastMessage.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-secondary" /> Quản lý Người dùng & Phân quyền
          </h2>
          <p className="text-xs text-brand-light/60 mt-1">
            Tổng cộng: <strong className="text-white">{totalElements}</strong> người dùng trong hệ thống
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm kiếm theo Tên, Username hoặc Email..."
            className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-xs"
          />
          <Search className="w-4 h-4 text-brand-light/40 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-brand-secondary shrink-0" />
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value as Role | 'ALL');
              setPage(0);
            }}
            className="glass-input px-3 py-2 rounded-xl text-xs w-full md:w-44"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEAM_LEAD">TEAM_LEAD</option>
            <option value="AGENT">AGENT</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-surfaceL2/80 text-brand-light/60 border-b border-brand-borderSubtle uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Đội phụ trách</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-borderSubtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-brand-light/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-secondary/30 border-t-brand-secondary rounded-full animate-spin" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-brand-light/50">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-brand-surfaceL2/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{u.fullName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-brand-secondary text-[11px]">{u.username}</code>
                      </td>
                      <td className="py-3 px-4">
                        <div>{u.email}</div>
                        {u.phoneNumber && (
                          <div className="text-[10px] text-brand-light/50">{u.phoneNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-4">
                        {u.assignedTeam ? (
                          <span className="text-[11px] text-brand-light/80 flex items-center gap-1">
                            <Building className="w-3 h-3 text-brand-secondary" /> {u.assignedTeam}
                          </span>
                        ) : (
                          <span className="text-[10px] text-brand-light/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          disabled={isCurrentSelf}
                          title={isCurrentSelf ? 'Không thể tự đổi vai trò của chính bạn' : 'Cập nhật vai trò'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                            isCurrentSelf
                              ? 'opacity-40 cursor-not-allowed bg-brand-surfaceL2/50 text-brand-light/40'
                              : 'bg-brand-secondary/20 hover:bg-brand-secondary/30 text-brand-secondary border border-brand-secondary/40'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Đổi vai trò</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-brand-borderSubtle flex items-center justify-between text-xs text-brand-light/60">
          <span>
            Trang {totalPages > 0 ? page + 1 : 0} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-brand-borderSubtle hover:bg-brand-surfaceL2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-brand-borderSubtle hover:bg-brand-surfaceL2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Update Role */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 relative">
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 text-brand-light/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-secondary" /> Cập nhật Vai trò Người dùng
            </h3>
            <p className="text-xs text-brand-light/60 mb-4">
              Người dùng: <strong className="text-white">{editingUser.fullName}</strong> ({editingUser.username})
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-financial-error/15 border border-financial-error/30 text-financial-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-brand-light/80 mb-1">
                  Chọn Vai trò mới
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="glass-input w-full px-3 py-2 rounded-xl"
                >
                  <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
                  <option value="AGENT">AGENT (Chuyên viên hỗ trợ)</option>
                  <option value="TEAM_LEAD">TEAM_LEAD (Trưởng nhóm kiểm soát)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên toàn quyền)</option>
                </select>
              </div>

              {(newRole === 'AGENT' || newRole === 'TEAM_LEAD') && (
                <div>
                  <label className="block font-medium text-brand-light/80 mb-1">
                    Đội ngũ phụ trách nghiệp vụ <span className="text-financial-error">*</span>
                  </label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    required
                    className="glass-input w-full px-3 py-2 rounded-xl"
                  >
                    {SUPPORT_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-brand-light/50 mt-1">
                    Nhân sự sẽ chỉ nhận và xử lý các ca ticket thuộc đội này.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary px-5 py-2 rounded-xl flex items-center gap-1.5"
                >
                  {isUpdating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

