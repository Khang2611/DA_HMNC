import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PortalLayout } from './layouts/PortalLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForbiddenPage } from './pages/error/ForbiddenPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { AgentTicketsPage } from './pages/agent/AgentTicketsPage';
import { LeadApprovalsPage } from './pages/lead/LeadApprovalsPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, getRoleRedirectPath, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-secondary/30 border-t-brand-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleRedirectPath()} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Protected Routes inside PortalLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PortalLayout />}>
              {/* ADMIN Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>

              {/* CUSTOMER Routes */}
              <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
                <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              </Route>

              {/* AGENT Routes */}
              <Route element={<ProtectedRoute allowedRoles={['AGENT']} />}>
                <Route path="/agent/tickets" element={<AgentTicketsPage />} />
              </Route>

              {/* TEAM_LEAD Routes */}
              <Route element={<ProtectedRoute allowedRoles={['TEAM_LEAD']} />}>
                <Route path="/lead/approvals" element={<LeadApprovalsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

