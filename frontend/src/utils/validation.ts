/**
 * validation.ts — Centralized Validation Architecture for 7Bank
 *
 * Provides typed, reusable validation utilities and sanitizers for:
 *   - Vietnamese mobile phone numbers (10 digits, valid mobile prefixes)
 *   - Email addresses (RFC-compliant syntax, whitespace trimming)
 *   - Phone or Email union for Sign In
 *   - Vietnamese Full Names (Unicode accents, min 2 chars, letters only)
 *   - Date of Birth (calendar validation, leap years, non-future, DD/MM/YYYY)
 *   - Passwords (min 8 chars, uppercase, lowercase, digit, special character)
 *   - Password confirmation
 *   - Mock OTP (exactly 6 digits)
 *   - 6-digit Transaction PIN (rejects repeated or sequential digits)
 *   - PIN confirmation
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  isValid: boolean;
  missingRequirements: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Configurable Rules & Patterns
// ─────────────────────────────────────────────────────────────────────────────

export const ValidationRules = {
  phone: {
    // Vietnamese mobile network prefixes (10 digits starting with 0):
    // Viettel: 032-039, 086, 096-098
    // Mobifone: 070, 076-079, 089, 090, 093
    // Vinaphone: 081-085, 088, 091, 094
    // Vietnamobile: 052, 056, 058, 092
    // Gmobile: 059, 099
    // Itelecom: 087
    // Wintel: 055
    // FPT: 077
    pattern: /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/,
    length: 10,
  },
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  fullName: {
    // Unicode letters including all Vietnamese accents and whitespace
    pattern: /^[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+$/,
    minLength: 2,
    maxLength: 50,
  },
  dateOfBirth: {
    pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    minYear: 1900,
  },
  password: {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasDigit: /[0-9]/,
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  },
  otp: {
    pattern: /^\d{6}$/,
    length: 6,
  },
  transactionPin: {
    pattern: /^\d{6}$/,
    length: 6,
    weakSequentialAsc: [
      '012345', '123456', '234567', '345678', '456789', '567890',
    ],
    weakSequentialDesc: [
      '987654', '876543', '765432', '654321', '543210', '432109',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Input Sanitizers
// ─────────────────────────────────────────────────────────────────────────────

export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, '').slice(0, ValidationRules.phone.length);
}

export function sanitizeEmail(input: string): string {
  return input.trim();
}

export function sanitizeDateOfBirth(input: string): string {
  // Allow only digits and slashes
  const clean = input.replace(/[^\d/]/g, '');
  // Auto-format DD/MM/YYYY if user types only digits
  const digitsOnly = clean.replace(/\D/g, '').slice(0, 8);
  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }
  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }
  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
}

export function sanitizeOTP(input: string): string {
  return input.replace(/\D/g, '').slice(0, ValidationRules.otp.length);
}

export function sanitizePin(input: string): string {
  return input.replace(/\D/g, '').slice(0, ValidationRules.transactionPin.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a Vietnamese mobile phone number.
 */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập số điện thoại.' };
  }
  const cleanPhone = trimmed.replace(/\s+/g, '');
  if (!/^\d+$/.test(cleanPhone)) {
    return { isValid: false, error: 'Số điện thoại chỉ được chứa các chữ số.' };
  }
  if (cleanPhone.length !== ValidationRules.phone.length) {
    return {
      isValid: false,
      error: `Số điện thoại phải bao gồm đúng ${ValidationRules.phone.length} chữ số.`,
    };
  }
  if (!ValidationRules.phone.pattern.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Đầu số di động không hợp lệ (hỗ trợ các đầu số 03, 05, 07, 08, 09).',
    };
  }
  return { isValid: true };
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập địa chỉ email.' };
  }
  if (!ValidationRules.email.pattern.test(trimmed)) {
    return { isValid: false, error: 'Địa chỉ email không đúng định dạng (ví dụ: ten@domain.com).' };
  }
  return { isValid: true };
}

/**
 * Validates an identifier that may be either a phone number or an email address.
 */
export function validatePhoneOrEmail(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập số điện thoại hoặc email.' };
  }
  // If it looks like an email (contains '@' or Latin letters)
  if (trimmed.includes('@') || /[a-zA-Z]/.test(trimmed)) {
    return validateEmail(trimmed);
  }
  // Otherwise treat as phone number
  return validatePhone(trimmed);
}

/**
 * Validates a Vietnamese full name.
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập họ và tên đầy đủ.' };
  }
  if (trimmed.length < ValidationRules.fullName.minLength) {
    return {
      isValid: false,
      error: `Họ và tên phải có tối thiểu ${ValidationRules.fullName.minLength} ký tự.`,
    };
  }
  if (trimmed.length > ValidationRules.fullName.maxLength) {
    return {
      isValid: false,
      error: `Họ và tên không vượt quá ${ValidationRules.fullName.maxLength} ký tự.`,
    };
  }
  if (!ValidationRules.fullName.pattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng.',
    };
  }
  // Check if at least 2 words exist (First and Last name)
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return {
      isValid: false,
      error: 'Vui lòng nhập đầy đủ cả họ và tên (tối thiểu 2 từ).',
    };
  }
  return { isValid: true };
}

/**
 * Validates Date of Birth in DD/MM/YYYY format with calendar rules & no future dates.
 */
export function validateDateOfBirth(dob: string): ValidationResult {
  const trimmed = dob.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập ngày tháng năm sinh.' };
  }

  const match = trimmed.match(ValidationRules.dateOfBirth.pattern);
  if (!match) {
    return {
      isValid: false,
      error: 'Ngày sinh phải theo đúng định dạng DD/MM/YYYY (ví dụ: 15/08/1995).',
    };
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (year < ValidationRules.dateOfBirth.minYear) {
    return {
      isValid: false,
      error: `Năm sinh không hợp lệ (tối thiểu từ năm ${ValidationRules.dateOfBirth.minYear}).`,
    };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Tháng sinh phải từ 01 đến 12.' };
  }

  // Days in month validation (including leap year for February)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maxDays = daysInMonth[month - 1];
  if (day < 1 || day > maxDays) {
    if (month === 2) {
      return {
        isValid: false,
        error: isLeapYear
          ? `Năm ${year} là năm nhuận, tháng 2 chỉ có tối đa 29 ngày.`
          : `Tháng 2 năm ${year} chỉ có tối đa 28 ngày.`,
      };
    }
    return {
      isValid: false,
      error: `Tháng ${month} chỉ có tối đa ${maxDays} ngày.`,
    };
  }

  // Check not in future
  const parsedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (parsedDate > today) {
    return {
      isValid: false,
      error: 'Ngày sinh không thể lớn hơn ngày hiện tại.',
    };
  }

  return { isValid: true };
}

/**
 * Checks individual password requirements for live UI indicators.
 */
export function checkPasswordCriteria(password: string): PasswordCriteria {
  const hasMinLength = password.length >= ValidationRules.password.minLength;
  const hasUppercase = ValidationRules.password.hasUppercase.test(password);
  const hasLowercase = ValidationRules.password.hasLowercase.test(password);
  const hasDigit = ValidationRules.password.hasDigit.test(password);
  const hasSpecial = ValidationRules.password.hasSpecial.test(password);

  const missingRequirements: string[] = [];
  if (!hasMinLength) missingRequirements.push(`Tối thiểu ${ValidationRules.password.minLength} ký tự`);
  if (!hasUppercase) missingRequirements.push('Chữ in hoa (A-Z)');
  if (!hasLowercase) missingRequirements.push('Chữ thường (a-z)');
  if (!hasDigit) missingRequirements.push('Chữ số (0-9)');
  if (!hasSpecial) missingRequirements.push('Ký tự đặc biệt (!@#$%...)');

  const isValid =
    hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecial,
    isValid,
    missingRequirements,
  };
}

/**
 * Validates password meets all security criteria.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Vui lòng nhập mật khẩu.' };
  }

  const criteria = checkPasswordCriteria(password);
  if (!criteria.isValid) {
    return {
      isValid: false,
      error: `Mật khẩu còn thiếu: ${criteria.missingRequirements.join(', ')}.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates password confirmation matches password.
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Vui lòng xác nhận lại mật khẩu.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Mật khẩu xác nhận không khớp.' };
  }
  return { isValid: true };
}

/**
 * Validates mock OTP code.
 */
export function validateOTP(otp: string): ValidationResult {
  const trimmed = otp.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập mã xác thực OTP.' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Mã OTP chỉ được chứa các chữ số.' };
  }
  if (trimmed.length !== ValidationRules.otp.length) {
    return {
      isValid: false,
      error: `Mã OTP phải gồm đủ ${ValidationRules.otp.length} chữ số.`,
    };
  }
  return { isValid: true };
}

/**
 * Validates a 6-digit transaction PIN, rejecting repeated or sequential patterns.
 */
export function validateTransactionPin(pin: string): ValidationResult {
  const trimmed = pin.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập mã PIN giao dịch.' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Mã PIN chỉ được chứa các chữ số.' };
  }
  if (trimmed.length !== ValidationRules.transactionPin.length) {
    return {
      isValid: false,
      error: `Mã PIN phải bao gồm đúng ${ValidationRules.transactionPin.length} chữ số.`,
    };
  }

  // Reject all identical digits: 000000, 111111, ..., 999999
  const isRepeated = /^(\d)\1{5}$/.test(trimmed);
  if (isRepeated) {
    return {
      isValid: false,
      error: 'Mã PIN quá đơn giản (không sử dụng 6 chữ số giống nhau).',
    };
  }

  // Reject common sequential patterns
  if (
    ValidationRules.transactionPin.weakSequentialAsc.includes(trimmed) ||
    ValidationRules.transactionPin.weakSequentialDesc.includes(trimmed)
  ) {
    return {
      isValid: false,
      error: 'Mã PIN quá dễ đoán (không sử dụng dãy số liên tiếp như 123456 hoặc 654321).',
    };
  }

  return { isValid: true };
}

/**
 * Validates confirm PIN matches original PIN.
 */
export function validateConfirmPin(pin: string, confirmPin: string): ValidationResult {
  if (!confirmPin) {
    return { isValid: false, error: 'Vui lòng nhập lại mã PIN để xác nhận.' };
  }
  if (pin !== confirmPin) {
    return { isValid: false, error: 'Mã PIN xác nhận không khớp.' };
  }
  return { isValid: true };
}
