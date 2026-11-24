/**
 * authService.ts — Mock Authentication Service for 7Bank
 *
 * Provides a clean service interface for authentication operations.
 * All logic is mock/simulated — replace with real API calls later.
 *
 * Security model:
 * - Passwords and PINs are NEVER stored in plaintext.
 * - Only a salted hash marker (simulated) is kept in AsyncStorage.
 * - Biometric auth is simulated (no real LocalAuthentication module required).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  SESSION_STATE: '@7bank_session_state',
  HAS_ACCOUNT: '@7bank_has_account',
  AUTH_TOKEN: '@7bank_auth_token',
  BIOMETRICS_ENABLED: '@7bank_biometrics_enabled',
  REGISTERED_PHONE: '@7bank_registered_phone',
  // We NEVER store actual passwords. This flag marks that a password hash exists.
  PASSWORD_SET: '@7bank_password_set',
  PIN_SET: '@7bank_pin_set',
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SessionState = 'unauthenticated' | 'locked' | 'authenticated';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface RegistrationData {
  phone: string;
  otp: string;
  fullName: string;
  dateOfBirth: string;
  password: string;
  pin: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock constants (replace with real API endpoints later)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_OTP = '123456';
const MOCK_VALID_PASSWORD = 'Demo1234!';

// ─────────────────────────────────────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine the launch state:
 * - 'unauthenticated': no account registered → show Welcome
 * - 'locked': account exists, session expired → show Locked Home
 * - 'authenticated': active session → show Home directly
 */
export async function getLaunchSessionState(): Promise<SessionState> {
  try {
    const [hasAccount, sessionState] = await Promise.all([
      AsyncStorage.getItem(KEYS.HAS_ACCOUNT),
      AsyncStorage.getItem(KEYS.SESSION_STATE),
    ]);

    if (!hasAccount) return 'unauthenticated';
    // If the user has an account but no active session, they're locked
    if (sessionState === 'authenticated') return 'locked'; // Always re-lock on cold start
    return 'locked';
  } catch {
    return 'unauthenticated';
  }
}

/**
 * Check whether a registered account exists on this device.
 */
export async function hasRegisteredAccount(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.HAS_ACCOUNT);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist session as authenticated.
 */
export async function setSessionAuthenticated(): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSION_STATE, 'authenticated');
}

/**
 * Lock the session (e.g., on background, sign-out).
 */
export async function lockSession(): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSION_STATE, 'locked');
}

/**
 * Clear all auth state (full sign-out).
 */
export async function signOut(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.SESSION_STATE,
    KEYS.AUTH_TOKEN,
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1: Request OTP for phone number.
 * Returns success immediately (mock).
 */
export async function requestOTP(_phone: string): Promise<AuthResult> {
  await _delay(800); // Simulate network
  return { success: true };
}

/**
 * Step 2: Verify OTP code.
 */
export async function verifyOTP(_phone: string, otp: string): Promise<AuthResult> {
  await _delay(600);
  if (otp === MOCK_OTP) {
    return { success: true };
  }
  return { success: false, error: 'Mã OTP không đúng. Vui lòng thử lại.' };
}

/**
 * Step 3: Complete registration with all data.
 */
export async function registerAccount(data: RegistrationData): Promise<AuthResult> {
  await _delay(1000);

  // Validate (simulated)
  if (data.password.length < 8) {
    return { success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }
  if (data.pin.length !== 6) {
    return { success: false, error: 'Mã PIN giao dịch phải đúng 6 chữ số.' };
  }

  // Store registration markers (never the actual password/PIN)
  await AsyncStorage.multiSet([
    [KEYS.HAS_ACCOUNT, 'true'],
    [KEYS.REGISTERED_PHONE, data.phone],
    [KEYS.PASSWORD_SET, 'true'],
    [KEYS.PIN_SET, 'true'],
    [KEYS.SESSION_STATE, 'authenticated'],
    [KEYS.AUTH_TOKEN, `mock_token_${Date.now()}`],
  ]);

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate with phone/email + password.
 * Mock: accepts any registered phone + MOCK_VALID_PASSWORD, or demo credentials.
 */
export async function loginWithPassword(
  phoneOrEmail: string,
  password: string,
): Promise<AuthResult> {
  await _delay(900);

  const hasAccount = await hasRegisteredAccount();

  // Demo login — always works with the demo credentials
  const isDemoLogin =
    (phoneOrEmail === '0901234567' || phoneOrEmail === '0901 234 567' ||
     phoneOrEmail === 'quy.nguyen@mauvebank.vn') &&
    password === MOCK_VALID_PASSWORD;

  if (!hasAccount && !isDemoLogin) {
    return { success: false, error: 'Số điện thoại hoặc email chưa được đăng ký.' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Mật khẩu không đúng. Vui lòng thử lại.' };
  }

  // For demo: accept any password ≥ 8 chars if account is registered,
  // or the fixed demo password
  if (!isDemoLogin && password !== MOCK_VALID_PASSWORD) {
    // Allow any ≥ 8 char password for accounts registered in this session
    if (password.length < 8) {
      return { success: false, error: 'Mật khẩu không đúng. Vui lòng thử lại.' };
    }
  }

  await AsyncStorage.multiSet([
    [KEYS.SESSION_STATE, 'authenticated'],
    [KEYS.AUTH_TOKEN, `mock_token_${Date.now()}`],
    [KEYS.HAS_ACCOUNT, 'true'],
  ]);

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Biometric Authentication (simulated)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if biometrics are available and enabled on this device.
 * Returns true in the demo environment.
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(KEYS.BIOMETRICS_ENABLED);
    // Default to enabled for demo if not explicitly disabled
    return enabled !== 'false';
  } catch {
    return true;
  }
}

/**
 * Simulate biometric authentication.
 * In production, replace with expo-local-authentication.
 */
export async function authenticateWithBiometrics(): Promise<AuthResult> {
  await _delay(700);
  // Simulate ~95% success rate in demo
  const success = Math.random() > 0.05;
  if (success) {
    await setSessionAuthenticated();
    return { success: true };
  }
  return {
    success: false,
    error: 'Xác thực sinh trắc học thất bại. Vui lòng thử lại hoặc dùng mật khẩu.',
  };
}

/**
 * Enable/disable biometrics preference.
 */
export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.BIOMETRICS_ENABLED, enabled ? 'true' : 'false');
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Auth (Locked Home)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate from the locked state using password.
 */
export async function unlockWithPassword(password: string): Promise<AuthResult> {
  await _delay(700);
  if (password.length < 8) {
    return { success: false, error: 'Mật khẩu không đúng.' };
  }
  await setSessionAuthenticated();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function _delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
