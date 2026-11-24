/**
 * Format currency in Vietnamese Dong (VND) with tabular numeral style
 */
export function formatVND(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('vi-VN');
  return `${isNegative ? '-' : ''}${formatted} ₫`;
}

/**
 * Mask account number for security (e.g. 9988 7766 5544 -> 9988 •••• 5544)
 */
export function maskAccountNumber(accNo: string): string {
  const clean = accNo.replace(/\s+/g, '');
  if (clean.length < 8) return accNo;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start} •••• ${end}`;
}

/**
 * Sanitize raw input by stripping non-digit characters and normalizing leading zeros.
 * Limits to 15 digits to avoid safe integer overflow.
 */
export function sanitizeVNDInput(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const str = String(raw).replace(/\D/g, '');
  if (!str) return '';
  const capped = str.slice(0, 15);
  // Normalize leading zeros: "05" -> "5", "00" -> "0"
  return capped.replace(/^0+(?=\d)/, '');
}

/**
 * Format a numeric string or number into Vietnamese thousands-separated string (e.g. 1500000 -> "1.500.000").
 * Returns empty string if input is empty or invalid.
 */
export function formatVNDInput(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const digits = sanitizeVNDInput(raw);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parses a formatted or unformatted VND string into an integer number.
 * Returns 0 if empty or invalid.
 */
export function parseVNDInput(formatted: string | number | null | undefined): number {
  if (formatted === null || formatted === undefined) return 0;
  if (typeof formatted === 'number') {
    return isNaN(formatted) ? 0 : Math.floor(Math.abs(formatted));
  }
  const digits = String(formatted).replace(/\D/g, '');
  if (!digits) return 0;
  const num = parseInt(digits.slice(0, 15), 10);
  return isNaN(num) ? 0 : num;
}
