/**
 * Mauve Banking — E-Wallet Top-Up Mock Data & Providers
 *
 * Centralized mock definitions for MoMo, ZaloPay, ShopeePay.
 * Deterministic fictional recipients for simulated wallet top-up.
 */

export type WalletProviderId = 'momo' | 'zalopay' | 'shopeepay';

export interface WalletProvider {
  id: WalletProviderId;
  name: string;
  shortName: string;
  brandColor: string;
  tagColor: string;
  initials: string;
  description: string;
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    shortName: 'MoMo',
    brandColor: '#A50064',
    tagColor: 'rgba(165, 0, 100, 0.22)',
    initials: 'MM',
    description: 'Ví điện tử MoMo',
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    shortName: 'ZaloPay',
    brandColor: '#0068FF',
    tagColor: 'rgba(0, 104, 255, 0.22)',
    initials: 'ZP',
    description: 'Ví điện tử ZaloPay',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    brandColor: '#EE4D2D',
    tagColor: 'rgba(238, 77, 45, 0.22)',
    initials: 'SP',
    description: 'Ví điện tử ShopeePay',
  },
];

export interface WalletRecipient {
  phone: string; // 10 digits normalized
  name: string;
  providerId: WalletProviderId;
  status: 'verified';
  kycLevel: string;
}

/**
 * Deterministic mock recipients across the three providers.
 * Note: '0901234567' is available on all 3 providers for easy testing.
 */
export const MOCK_WALLET_RECIPIENTS: WalletRecipient[] = [
  // Multi-wallet user for quick testing
  { phone: '0901234567', name: 'NGUYỄN VĂN AN', providerId: 'momo', status: 'verified', kycLevel: 'Đã định danh cấp 2' },
  { phone: '0901234567', name: 'NGUYỄN VĂN AN', providerId: 'zalopay', status: 'verified', kycLevel: 'Đã định danh cấp 2' },
  { phone: '0901234567', name: 'NGUYỄN VĂN AN', providerId: 'shopeepay', status: 'verified', kycLevel: 'Đã định danh cấp 2' },

  // MoMo recipients
  { phone: '0987654321', name: 'TRẦN THỊ MAI', providerId: 'momo', status: 'verified', kycLevel: 'Đã định danh cấp 2' },
  { phone: '0912345678', name: 'LÊ HOÀNG NAM', providerId: 'momo', status: 'verified', kycLevel: 'Đã định danh cấp 2' },

  // ZaloPay recipients
  { phone: '0888999888', name: 'PHẠM MINH ĐỨC', providerId: 'zalopay', status: 'verified', kycLevel: 'Đã định danh cấp 2' },
  { phone: '0777123456', name: 'HOÀNG THU THẢO', providerId: 'zalopay', status: 'verified', kycLevel: 'Đã định danh cấp 2' },

  // ShopeePay recipients
  { phone: '0933445566', name: 'VÕ ĐỨC TRÍ', providerId: 'shopeepay', status: 'verified', kycLevel: 'Đã định danh cấp 2' },
  { phone: '0966778899', name: 'ĐẶNG BÍCH NGỌC', providerId: 'shopeepay', status: 'verified', kycLevel: 'Đã định danh cấp 2' },
];

/** Demo quick suggestions to help test */
export const DEMO_PRESET_NUMBERS = [
  { phone: '0901 234 567', rawPhone: '0901234567', label: 'Nguyễn Văn An (Tất cả ví)' },
  { phone: '0987 654 321', rawPhone: '0987654321', label: 'Trần Thị Mai (MoMo)' },
  { phone: '0888 999 888', rawPhone: '0888999888', label: 'Phạm Minh Đức (ZaloPay)' },
  { phone: '0933 445 566', rawPhone: '0933445566', label: 'Võ Đức Trí (ShopeePay)' },
];

/** Standard quick amount buttons in VND */
export const WALLET_QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export const MIN_TOPUP_AMOUNT = 10000;
export const MAX_TOPUP_AMOUNT = 20000000;

/** Normalize phone number by removing spaces, dashes, dots */
export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[\s.-]/g, '');
}

/** Format 10-digit phone number into 09xx xxx xxx for display */
export function formatPhoneNumberDisplay(phone: string): string {
  const clean = normalizePhoneNumber(phone);
  if (clean.length === 10) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return clean;
}

/** Mask phone number: 0901234567 -> 0901 ••• 567 */
export function maskPhoneNumber(phone: string): string {
  const clean = normalizePhoneNumber(phone);
  if (clean.length < 8) return phone;
  return `${clean.slice(0, 4)} ••• ${clean.slice(-3)}`;
}

/**
 * Validate Vietnamese 10-digit mobile phone number.
 * Supported prefixes: 03, 05, 07, 08, 09
 */
export function validateVietnamesePhone(phone: string): { isValid: boolean; error?: string } {
  const clean = normalizePhoneNumber(phone);
  if (!clean) {
    return { isValid: false, error: 'Vui lòng nhập số điện thoại ví' };
  }
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Số điện thoại chỉ bao gồm chữ số' };
  }
  if (clean.length !== 10) {
    return { isValid: false, error: 'Số điện thoại phải bao gồm đúng 10 chữ số' };
  }
  if (!/^(03|05|07|08|09)\d{8}$/.test(clean)) {
    return { isValid: false, error: 'Đầu số không hợp lệ (hỗ trợ 03, 05, 07, 08, 09)' };
  }
  return { isValid: true };
}

/** Look up deterministic recipient in mock database */
export function findWalletRecipient(
  providerId: WalletProviderId,
  phone: string
): WalletRecipient | null {
  const clean = normalizePhoneNumber(phone);
  return (
    MOCK_WALLET_RECIPIENTS.find(
      (r) => r.providerId === providerId && r.phone === clean
    ) || null
  );
}
