import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  Shield,
  Users,
  LayoutDashboard,
  CreditCard,
  Send,
  PiggyBank,
  Headphones,
  CheckSquare,
  LogOut,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building,
} from 'lucide-react';
import { Role } from '../types/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const PortalLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = (currentRole: Role | null): NavItem[] => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { label: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
        ];
      case 'CUSTOMER':
        return [
          { label: 'Tổng quan Tài khoản', path: '/customer/dashboard', icon: LayoutDashboard },
        ];
      case 'AGENT':
        return [
          { label: 'Hàng đợi Ticket Đội', path: '/agent/tickets', icon: Headphones },
        ];
      case 'TEAM_LEAD':
        return [
          { label: 'Phê duyệt P1 (Maker-Checker)', path: '/lead/approvals', icon: CheckSquare, badge: 'P1' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(role);

  const getRoleBadgeStyle = (r: Role | null) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'TEAM_LEAD':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'AGENT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CUSTOMER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRoleLabel = (r: Role | null) => {
    switch (r) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'TEAM_LEAD':
        return 'Trưởng nhóm (Lead)';
      case 'AGENT':
        return 'Chuyên viên (Agent)';
      case 'CUSTOMER':
        return 'Khách hàng';
      default:
        return 'Người dùng';
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex text-brand-light">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-surfaceL1/90 border-r border-brand-borderSubtle flex flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="p-5 border-b border-brand-borderSubtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary p-0.5 flex items-center justify-center shadow-glass">
            <div className="w-full h-full bg-brand-surfaceL1 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand-secondary" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-none">VinaTrust</h1>
            <span className="text-[10px] text-brand-light/50 tracking-wider uppercase font-semibold">
              Bank Portal
            </span>
          </div>
        </div>

        {/* User Card Summary */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-brand-surfaceL2/80 border border-brand-borderMauve/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-secondary/20 border border-brand-secondary/40 flex items-center justify-center text-brand-secondary font-bold text-xs uppercase">
              {user?.fullName?.slice(0, 2) || user?.username?.slice(0, 2) || 'VT'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName || user?.username}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getRoleBadgeStyle(role)}`}>
                  {role}
                </span>
              </div>
            </div>
          </div>
          {user?.assignedTeam && (
            <div className="mt-2.5 pt-2 border-t border-brand-borderSubtle/60 flex items-center gap-1 text-[11px] text-brand-light/70 truncate">
              <Building className="w-3 h-3 text-brand-secondary shrink-0" />
              <span className="truncate">Đội: {user.assignedTeam}</span>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
          <div className="text-[10px] font-bold text-brand-light/40 uppercase tracking-wider px-3 py-1">
            Chức năng chính
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-secondary/20 text-white border border-brand-secondary/40 shadow-sm'
                      : 'text-brand-light/70 hover:bg-brand-surfaceL2/60 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 text-brand-secondary shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-financial-error/20 text-financial-error font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-brand-borderSubtle">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-financial-error/80 hover:text-financial-error hover:bg-financial-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-brand-surfaceL1/60 backdrop-blur-md border-b border-brand-borderSubtle px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-brand-light/60">
            <span>VinaTrust</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium capitalize">
              {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-surfaceL2/80 border border-brand-borderMauve/20 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-brand-light/80 font-medium">{getRoleLabel(role)}</span>
              {user?.emailVerified && (
                <span title="Email đã xác thực">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 flex-1 bg-brand-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
