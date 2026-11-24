export type Role = 'CUSTOMER' | 'AGENT' | 'TEAM_LEAD' | 'ADMIN';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'SUSPENDED';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  role: Role;
  status: UserStatus;
  kycStatus?: string;
  kycBiometricVerified: boolean;
  emailVerified: boolean;
  customerTier?: string;
  assignedTeam?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSummary {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  kycStatus?: string;
  customerTier?: string;
  kycBiometricVerified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  status: string;
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface UpdateUserRoleRequest {
  role: Role;
  assignedTeam?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

