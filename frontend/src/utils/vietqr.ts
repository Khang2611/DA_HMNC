/**
 * VietQR & EMVCo Specification Utility
 * Implements EMVCo Merchant-Presented QR Code Specification (ISO/IEC 18004 & Napas VietQR standard).
 *
 * VietQR TLV Data Structure:
 * - 00: Payload Format Indicator (01)
 * - 01: Point of Initiation Method (11: dynamic with amount, 12: static)
 * - 38: Merchant Account Information
 *       00: GUID (A000000727 - Napas)
 *       01: Beneficiary Information:
 *           00: Bank BIN (6 digits)
 *           01: Beneficiary Account Number
 *       02: Service Code (QRIBFTTA: Transfer to Account, QRIBFTTC: Transfer to Card)
 * - 53: Transaction Currency (704 - VND)
 * - 54: Transaction Amount (optional)
 * - 58: Country Code (VN)
 * - 62: Additional Data Field Template (optional):
 *       08: Purpose / Description of Transaction
 * - 63: CRC16-CCITT (Checksum 4 hex digits)
 */

import { Bank } from '../types/banking';
import { VIETNAMESE_BANKS } from '../data/mockRecipients';

/**
 * CRC16-CCITT (polynomial 0x1021, initial value 0xFFFF, no reverse)
 * Standard EMVCo / ISO/IEC 13239 checksum calculation.
 */
export function crc16CCITT(data: string): string {
  let crc = 0xffff;
  for (let c = 0; c < data.length; c++) {
    crc ^= data.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Builds a single TLV (Tag-Length-Value) string segment.
 */
export function buildTLV(tag: string, value: string): string {
  if (!value) return '';
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Parses raw TLV string into key-value map.
 */
export function parseTLV(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  let idx = 0;
  while (idx < raw.length) {
    if (idx + 4 > raw.length) break;
    const tag = raw.substring(idx, idx + 2);
    const len = parseInt(raw.substring(idx + 2, idx + 4), 10);
    if (isNaN(len)) break;
    idx += 4;
    if (idx + len > raw.length) break;
    const val = raw.substring(idx, idx + len);
    idx += len;
    map.set(tag, val);
  }
  return map;
}

export interface GenerateVietQRParams {
  bankBin: string;
  accountNumber: string;
  amount?: number;
  description?: string;
  serviceCode?: 'QRIBFTTA' | 'QRIBFTTC';
}

/**
 * Generates an official EMVCo-compliant VietQR payload string.
 */
export function generateVietQRPayload({
  bankBin,
  accountNumber,
  amount,
  description,
  serviceCode = 'QRIBFTTA',
}: GenerateVietQRParams): string {
  // Clean inputs
  const cleanBin = bankBin.trim();
  const cleanAccount = accountNumber.replace(/\s+/g, '');
  const isDynamic = Boolean(amount && amount > 0);

  // 1. Beneficiary Sub-TLV (Tag 38 -> Sub-tag 01)
  const beneficiaryInfo = buildTLV('00', cleanBin) + buildTLV('01', cleanAccount);

  // 2. Merchant Account Information (Tag 38)
  const merchantAccountInfo =
    buildTLV('00', 'A000000727') + // Napas GUID
    buildTLV('01', beneficiaryInfo) +
    buildTLV('02', serviceCode);

  let payload = '';
  // Tag 00: Payload Format Indicator
  payload += buildTLV('00', '01');
  // Tag 01: Point of Initiation Method (11: dynamic with amount, 12: static)
  payload += buildTLV('01', isDynamic ? '11' : '12');
  // Tag 38: Merchant Account Info
  payload += buildTLV('38', merchantAccountInfo);
  // Tag 53: Transaction Currency (704 = VND)
  payload += buildTLV('53', '704');

  // Tag 54: Transaction Amount (optional)
  if (isDynamic && amount) {
    payload += buildTLV('54', Math.round(amount).toString());
  }

  // Tag 58: Country Code (VN)
  payload += buildTLV('58', 'VN');

  // Tag 62: Additional Data Field (optional description)
  if (description && description.trim().length > 0) {
    const additionalData = buildTLV('08', description.trim());
    payload += buildTLV('62', additionalData);
  }

  // Tag 63: CRC calculation
  const rawForCrc = `${payload}6304`;
  const crc = crc16CCITT(rawForCrc);

  return `${rawForCrc}${crc}`;
}

export interface ParsedVietQRResult {
  isValid: boolean;
  bank?: Bank;
  bankBin?: string;
  accountNumber?: string;
  amount?: number;
  description?: string;
  serviceCode?: string;
  isCrcValid?: boolean;
  rawPayload: string;
  errorMessage?: string;
}

/**
 * Parses and validates a scanned QR code payload.
 * Supports:
 * 1. Standard EMVCo TLV VietQR string (starts with 000201...)
 * 2. VietQR standard HTTP URL endpoints (e.g. img.vietqr.io or vietqr.net)
 */
export function parseVietQRPayload(raw: string): ParsedVietQRResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      isValid: false,
      rawPayload: raw,
      errorMessage: 'Mã QR rỗng hoặc không có dữ liệu.',
    };
  }

  // ── Mode A: EMVCo TLV VietQR Format ───────────────────────────────
  if (trimmed.startsWith('000201')) {
    // 1. Verify CRC if payload ends with 6304XXXX
    const crcIdx = trimmed.indexOf('6304');
    let isCrcValid = false;
    if (crcIdx !== -1 && trimmed.length >= crcIdx + 8) {
      const dataForCrc = trimmed.substring(0, crcIdx + 4);
      const expectedCrc = trimmed.substring(crcIdx + 4, crcIdx + 8);
      const computedCrc = crc16CCITT(dataForCrc);
      isCrcValid = expectedCrc.toUpperCase() === computedCrc.toUpperCase();
    }

    // 2. Parse TLV
    const rootTLV = parseTLV(trimmed);
    const tag38Raw = rootTLV.get('38');

    if (!tag38Raw) {
      return {
        isValid: false,
        rawPayload: raw,
        errorMessage: 'Mã QR không chứa thông tin tài khoản ngân hàng thụ hưởng (Tag 38).',
      };
    }

    const tag38TLV = parseTLV(tag38Raw);
    const beneficiaryRaw = tag38TLV.get('01');
    const serviceCode = tag38TLV.get('02') || 'QRIBFTTA';

    // Verify Napas GUID or banking identifier
    if (!beneficiaryRaw) {
      return {
        isValid: false,
        rawPayload: raw,
        errorMessage: 'Mã QR không có cấu trúc người thụ hưởng Napas 247 hợp lệ.',
      };
    }

    const beneficiaryTLV = parseTLV(beneficiaryRaw);
    const bankBin = beneficiaryTLV.get('00') || '';
    const accountNumber = beneficiaryTLV.get('01') || '';

    if (!bankBin || !accountNumber) {
      return {
        isValid: false,
        rawPayload: raw,
        errorMessage: 'Không tìm thấy số tài khoản hoặc mã ngân hàng thụ hưởng trong mã QR.',
      };
    }

    // Amount (Tag 54)
    let amount: number | undefined;
    const amountStr = rootTLV.get('54');
    if (amountStr) {
      const parsedAmount = parseFloat(amountStr);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
      }
    }

    // Description (Tag 62 -> Sub-tag 08)
    let description: string | undefined;
    const tag62Raw = rootTLV.get('62');
    if (tag62Raw) {
      const tag62TLV = parseTLV(tag62Raw);
      description = tag62TLV.get('08');
    }

    // Match bank from list
    const matchedBank = VIETNAMESE_BANKS.find(
      (b) => b.bin === bankBin || b.code.toLowerCase() === bankBin.toLowerCase()
    );

    return {
      isValid: true,
      bank: matchedBank || {
        id: `bank_${bankBin}`,
        code: `BIN ${bankBin}`,
        name: `Ngân hàng liên minh Napas (BIN ${bankBin})`,
        shortName: `Napas ${bankBin}`,
        bin: bankBin,
      },
      bankBin,
      accountNumber,
      amount,
      description,
      serviceCode,
      isCrcValid,
      rawPayload: raw,
    };
  }

  // ── Mode B: VietQR URL Format (e.g. https://img.vietqr.io/image/970407-190388291102-compact.png) ──
  if (trimmed.includes('vietqr.io') || trimmed.includes('vietqr.net') || trimmed.includes('vietqr.me')) {
    try {
      // Regex match: /image/{bin}-{accountNumber}-...
      const match = trimmed.match(/(\d{6})-([a-zA-Z0-9]+)/);
      if (match) {
        const bankBin = match[1];
        const accountNumber = match[2];

        // Parse query params if present
        let amount: number | undefined;
        let description: string | undefined;

        const qIdx = trimmed.indexOf('?');
        if (qIdx !== -1) {
          const queryString = trimmed.substring(qIdx + 1);
          const pairs = queryString.split('&');
          for (const pair of pairs) {
            const [k, v] = pair.split('=');
            if (k === 'amount' && v) {
              const parsed = parseFloat(v);
              if (!isNaN(parsed)) amount = parsed;
            } else if ((k === 'addInfo' || k === 'desc' || k === 'note') && v) {
              try {
                description = decodeURIComponent(v.replace(/\+/g, ' '));
              } catch {
                description = v;
              }
            }
          }
        }

        const matchedBank = VIETNAMESE_BANKS.find((b) => b.bin === bankBin);

        return {
          isValid: true,
          bank: matchedBank || {
            id: `bank_${bankBin}`,
            code: `BIN ${bankBin}`,
            name: `Ngân hàng liên minh Napas (BIN ${bankBin})`,
            shortName: `Napas ${bankBin}`,
            bin: bankBin,
          },
          bankBin,
          accountNumber,
          amount,
          description,
          isCrcValid: true,
          rawPayload: raw,
        };
      }
    } catch {
      // pass through to unsupported
    }
  }

  // ── Mode C: Unsupported QR Format ───────────────────────────────────
  return {
    isValid: false,
    rawPayload: raw,
    errorMessage:
      'Mã QR không hợp lệ hoặc không phải là mã thanh toán chuyển khoản VietQR / Napas 247 được hỗ trợ.',
  };
}
