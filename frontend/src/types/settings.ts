/**
 * Settings and User Profile Types — Mauve Banking
 */

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  avatarInitial: string;
  phoneNumber: string; // e.g. "0901 234 567"
  email: string; // e.g. "quy.nguyen@mauvebank.vn"
  dateOfBirth: string; // e.g. "15/08/1994"
  idDocumentType: string; // e.g. "Căn cước công dân gắn chip"
  idDocumentNumber: string; // e.g. "079094001234"
  address: string; // e.g. "Số 123 Lê Duẩn, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh"
  customerTier: string; // e.g. "Hội viên Mauve Premier"
  customerId: string; // e.g. "MB-8829104"
  kycStatus: 'verified' | 'unverified';
  kycVerifiedAt?: string; // e.g. "20/01/2025"
}

export interface NotificationPreferences {
  transactions: boolean;
  balanceChanges: boolean;
  billReminders: boolean;
  savingsReminders: boolean;
  securityAlerts: boolean;
  promotions: boolean;
  hideAmountInPreview: boolean;
}

export interface SettingsPreferences {
  defaultAccountId: string;
  biometricsEnabled: boolean;
  autoLockMinutes: number; // 1, 5, 15, or 0 (never)
  hideBalanceByDefault: boolean;
  hideSensitiveInfoInPreview: boolean;
  notifications: NotificationPreferences;
  reduceMotion: boolean;
  language: 'vi' | 'en';
  theme: 'dark'; // Mauve Back in Black
}

export type DeviceType = 'ios' | 'android' | 'web';

export interface SessionDevice {
  id: string;
  deviceName: string;
  deviceType: DeviceType;
  operatingSystem: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export type FAQCategory = 'all' | 'transfer' | 'cards' | 'bills' | 'qr' | 'savings' | 'security';

export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

export type SettingsSubpageKey =
  | 'profile'
  | 'identity'
  | 'default_account'
  | 'security'
  | 'devices'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'balance_visibility'
  | 'help'
  | 'contact'
  | 'terms'
  | 'privacy_policy'
  | 'about';
