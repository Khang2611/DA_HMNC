import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Role } from '../types/api';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginSuccess: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getRoleRedirectPath: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('userProfile');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getRoleRedirectPath = useCallback((targetRole?: Role): string => {
    const r = targetRole || user?.role;
    switch (r) {
      case 'ADMIN':
        return '/admin/users';
      case 'CUSTOMER':
        return '/customer/dashboard';
      case 'AGENT':
        return '/agent/tickets';
      case 'TEAM_LEAD':
        return '/lead/approvals';
      default:
        return '/login';
    }
  }, [user?.role]);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('userProfile', JSON.stringify(res.data));
      }
    } catch {
      // Token expired or invalid
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [refreshProfile]);

  const loginSuccess = (accessToken: string, refreshToken: string, userData: UserProfile) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userProfile', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        loginSuccess,
        logout,
        refreshProfile,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

