import { axiosClient } from './axiosClient';
import {
  ApiResponse,
  AuthResponse,
  UserProfile,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from '../types/api';

export const authApi = {
  login: async (credentials: { identifier: string; password: string }) => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await axiosClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    const response = await axiosClient.post<ApiResponse<void>>('/auth/verify-email', data);
    return response.data;
  },

  resendVerification: async (data: ResendVerificationRequest) => {
    const response = await axiosClient.post<ApiResponse<void>>('/auth/resend-verification', data);
    return response.data;
  },

  getMe: async () => {
    const response = await axiosClient.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await axiosClient.post<ApiResponse<void>>('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
    }
  },
};

