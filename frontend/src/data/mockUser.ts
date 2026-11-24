/**
 * mockUser.ts — Mock User Profile, Settings Preferences, and Storage Helpers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  SettingsPreferences,
  SessionDevice,
  FAQItem,
} from '../types/settings';

export const USER_PROFILE_STORAGE_KEY = '@mauve_user_profile';
export const SETTINGS_PREFS_STORAGE_KEY = '@mauve_settings_prefs';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr_01',
  fullName: 'Quý Nguyễn',
  avatarInitial: 'Q',
  phoneNumber: '0901 234 567',
  email: 'quy.nguyen@mauvebank.vn',
  dateOfBirth: '15/08/1994',
  idDocumentType: 'Căn cước công dân gắn chip',
  idDocumentNumber: '079094001234',
  address: 'Số 123 Lê Duẩn, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  customerTier: 'Hội viên Mauve Premier',
  customerId: 'MB-8829104',
  kycStatus: 'verified',
  kycVerifiedAt: '20/01/2025',
};

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  defaultAccountId: 'acc_primary',
  biometricsEnabled: true,
  autoLockMinutes: 5,
  hideBalanceByDefault: false,
  hideSensitiveInfoInPreview: true,
  notifications: {
    transactions: true,
    balanceChanges: true,
    billReminders: true,
    savingsReminders: true,
    securityAlerts: true,
    promotions: false,
    hideAmountInPreview: true,
  },
  reduceMotion: false,
  language: 'vi',
  theme: 'dark',
};

export const MOCK_SESSIONS: SessionDevice[] = [
  {
    id: 'dev_01',
    deviceName: 'iPhone 15 Pro',
    deviceType: 'ios',
    operatingSystem: 'iOS 18.2',
    ipAddress: '14.161.42.10',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    lastActive: 'Đang hoạt động trên thiết bị này',
    isCurrent: true,
  },
  {
    id: 'dev_02',
    deviceName: 'MacBook Pro 16"',
    deviceType: 'web',
    operatingSystem: 'macOS Sequoia (Safari 18.2)',
    ipAddress: '14.161.42.10',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    lastActive: '12 phút trước',
    isCurrent: false,
  },
  {
    id: 'dev_03',
    deviceName: 'iPad Air 5',
    deviceType: 'ios',
    operatingSystem: 'iPadOS 17.5',
    ipAddress: '113.160.88.92',
    location: 'Đà Nẵng, Việt Nam',
    lastActive: '2 ngày trước',
    isCurrent: false,
  },
];

export const MOCK_FAQS: FAQItem[] = [
  {
    id: 'faq_01',
    category: 'transfer',
    question: 'Hạn mức chuyển khoản nhanh Napas 24/7 là bao nhiêu?',
    answer: 'Hạn mức chuyển khoản nhanh Napas 24/7 tối đa là 500.000.000 ₫/giao dịch và không giới hạn số lần giao dịch trong ngày đối với tài khoản đã hoàn tất sinh trắc học eKYC.',
  },
  {
    id: 'faq_02',
    category: 'transfer',
    question: 'Làm thế nào để tra soát giao dịch chuyển khoản bị treo?',
    answer: 'Trong mục Lịch sử giao dịch, chọn giao dịch cần hỗ trợ và nhấn "Yêu cầu tra soát" hoặc gọi hotline 1900 8829 kèm Mã tham chiếu giao dịch để được kiểm tra tức thời.',
  },
  {
    id: 'faq_03',
    category: 'cards',
    question: 'Tôi có thể khóa thẻ tức thì khi bị thất lạc không?',
    answer: 'Có. Bạn vào mục Quản lý thẻ, chọn thẻ tương ứng và gạt nút "Khóa thẻ tức thì". Thẻ sẽ bị tạm ngừng ngay lập tức cho đến khi bạn mở khóa lại.',
  },
  {
    id: 'faq_04',
    category: 'cards',
    question: 'Cách thay đổi hạn mức chi tiêu thẻ tín dụng?',
    answer: 'Vào Quản lý thẻ > Chọn Thẻ tín dụng > Nhấn Cài đặt hạn mức để điều chỉnh hạn mức thanh toán trực tuyến hoặc mua sắm hàng ngày theo nhu cầu.',
  },
  {
    id: 'faq_05',
    category: 'bills',
    question: 'Hóa đơn đã thanh toán mất bao lâu để hệ thống nhà cung cấp cập nhật?',
    answer: 'Phần lớn các nhà cung cấp (Điện lực EVN, Cấp nước, Viễn thông, Internet) sẽ gạch nợ tức thời trong vòng 1-5 phút kể từ khi giao dịch thành công.',
  },
  {
    id: 'faq_06',
    category: 'qr',
    question: 'Mã VietQR có hỗ trợ chuyển khoản từ các ngân hàng khác không?',
    answer: 'Có. VietQR đạt chuẩn NAPAS và Ngân hàng Nhà nước, cho phép nhận tiền từ tất cả hơn 40 ngân hàng và ví điện tử thành viên tại Việt Nam hoàn toàn miễn phí.',
  },
  {
    id: 'faq_07',
    category: 'savings',
    question: 'Rút tiền tiết kiệm trước hạn có bị mất lãi không?',
    answer: 'Khi tất toán sổ tiết kiệm trước ngày đáo hạn, số tiền gốc sẽ được hưởng mức lãi suất không kỳ hạn hiện hành theo quy định của Ngân hàng Nhà nước.',
  },
  {
    id: 'faq_08',
    category: 'security',
    question: 'Tại sao cần xác thực sinh trắc học khuôn mặt khi chuyển tiền trên 10 triệu?',
    answer: 'Theo Quyết định 2345/QĐ-NHNN, từ ngày 01/07/2024, các giao dịch chuyển tiền trên 10.000.000 ₫ hoặc tổng giao dịch trong ngày vượt 20.000.000 ₫ bắt buộc phải xác thực khuôn mặt khớp với dữ liệu trên CCCD gắn chip.',
  },
  {
    id: 'faq_09',
    category: 'security',
    question: 'Tôi phải làm gì khi đổi số điện thoại hoặc thiết bị đăng nhập mới?',
    answer: 'Để bảo vệ tài khoản, bạn cần thực hiện xác thực khuôn mặt eKYC trên thiết bị mới hoặc đến quầy giao dịch Mauve Bank gần nhất kèm CCCD gốc.',
  },
];

/**
 * Mask a phone number (e.g. "0901 234 567" -> "0901 ••• 567")
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return phone;
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start} ••• ${end}`;
}

/**
 * Mask an email address (e.g. "quy.nguyen@mauvebank.vn" -> "q•••••n@mauvebank.vn")
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0]}•@${domain}`;
  }
  const first = username[0];
  const last = username[username.length - 1];
  const dots = '•'.repeat(Math.min(5, Math.max(3, username.length - 2)));
  return `${first}${dots}${last}@${domain}`;
}

/**
 * Mask an ID document number (e.g. "079094001234" -> "0790 •••• 1234")
 */
export function maskIdCard(idDoc: string): string {
  const clean = idDoc.replace(/\s+/g, '');
  if (clean.length < 8) return idDoc;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start} •••• ${end}`;
}

/**
 * Load user profile from AsyncStorage with fallback to INITIAL_USER_PROFILE
 */
export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return { ...INITIAL_USER_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...INITIAL_USER_PROFILE, ...parsed };
  } catch (err) {
    console.warn('[mockUser] Failed to load user profile:', err);
    return { ...INITIAL_USER_PROFILE };
  }
}

/**
 * Save user profile to AsyncStorage
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[mockUser] Failed to save user profile:', err);
  }
}

/**
 * Load settings preferences from AsyncStorage with fallback to DEFAULT_SETTINGS_PREFERENCES
 */
export async function loadSettingsPreferences(): Promise<SettingsPreferences> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS_PREFERENCES,
      ...parsed,
      notifications: {
        ...DEFAULT_SETTINGS_PREFERENCES.notifications,
        ...(parsed.notifications || {}),
      },
    };
  } catch (err) {
    console.warn('[mockUser] Failed to load settings preferences:', err);
    return { ...DEFAULT_SETTINGS_PREFERENCES };
  }
}

/**
 * Save settings preferences to AsyncStorage
 */
export async function saveSettingsPreferences(prefs: SettingsPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('[mockUser] Failed to save settings preferences:', err);
  }
}
