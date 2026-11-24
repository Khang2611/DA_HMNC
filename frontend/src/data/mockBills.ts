/**
 * Mock Bills & Utility Providers — Mauve Banking
 *
 * Centralized deterministic mock data for Bill Payment module.
 * Categories: Tiền điện, Tiền nước, Internet, Truyền hình, Di động trả sau.
 */

import React from 'react';
import {
  Zap,
  Droplets,
  Wifi,
  Tv,
  Smartphone,
} from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BillCategory = 'electric' | 'water' | 'internet' | 'tv' | 'postpaid';

export interface BillService {
  id: BillCategory;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

export interface BillProvider {
  id: string;
  categoryId: BillCategory;
  name: string;
  shortName: string;
  codeLabel: string;
  codePlaceholder: string;
  codeHelper: string;
}

export interface BillInvoice {
  id: string;
  providerId: string;
  customerCode: string;
  customerName: string;
  customerAddress?: string;
  billingPeriod: string;
  amountDue: number;
  fee: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
  paidAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Categories
// ─────────────────────────────────────────────────────────────────────────────

export const BILL_SERVICES: BillService[] = [
  {
    id: 'electric',
    title: 'Tiền điện',
    subtitle: 'EVN toàn quốc',
    Icon: Zap,
  },
  {
    id: 'water',
    title: 'Tiền nước',
    subtitle: 'Cấp nước các tỉnh thành',
    Icon: Droplets,
  },
  {
    id: 'internet',
    title: 'Internet',
    subtitle: 'Viettel, FPT, VNPT',
    Icon: Wifi,
  },
  {
    id: 'tv',
    title: 'Truyền hình',
    subtitle: 'VTVCab, K+, FPT Play',
    Icon: Tv,
  },
  {
    id: 'postpaid',
    title: 'Di động trả sau',
    subtitle: 'Cước thuê bao di động',
    Icon: Smartphone,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────────────────────

export const BILL_PROVIDERS: BillProvider[] = [
  // ── Tiền điện ──
  {
    id: 'evn_hanoi',
    categoryId: 'electric',
    name: 'EVN Hà Nội',
    shortName: 'EVN HN',
    codeLabel: 'Mã khách hàng (PE)',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng in trên hóa đơn điện hoặc thông báo tiền điện (bắt đầu bằng PE)',
  },
  {
    id: 'evn_hcm',
    categoryId: 'electric',
    name: 'EVN TP. Hồ Chí Minh',
    shortName: 'EVN HCMC',
    codeLabel: 'Mã khách hàng (PE)',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng gồm 11 ký tự bắt đầu bằng PE in trên tin nhắn hoặc giấy báo',
  },
  {
    id: 'evn_central',
    categoryId: 'electric',
    name: 'EVN Miền Trung',
    shortName: 'EVN MT',
    codeLabel: 'Mã khách hàng (PC)',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng bắt đầu bằng PC do Tổng công ty Điện lực Miền Trung cấp',
  },
  {
    id: 'evn_north',
    categoryId: 'electric',
    name: 'EVN Miền Bắc',
    shortName: 'EVN MB',
    codeLabel: 'Mã khách hàng (PA)',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng bắt đầu bằng PA in trên biên nhận thu tiền',
  },
  {
    id: 'evn_south',
    categoryId: 'electric',
    name: 'EVN Miền Nam',
    shortName: 'EVN MN',
    codeLabel: 'Mã khách hàng (PB)',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng bắt đầu bằng PB thuộc Tổng công ty Điện lực Miền Nam',
  },

  // ── Tiền nước ──
  {
    id: 'water_hanoi',
    categoryId: 'water',
    name: 'Nước sạch Hà Nội (Hawaco)',
    shortName: 'Hawaco',
    codeLabel: 'Mã khách hàng',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng in tại góc trên bên phải giấy báo tiền nước',
  },
  {
    id: 'water_sawaco',
    categoryId: 'water',
    name: 'Cấp nước Sài Gòn (Sawaco)',
    shortName: 'Sawaco',
    codeLabel: 'Mã danh bộ',
    codePlaceholder: 'Nhập mã danh bộ',
    codeHelper: 'Mã danh bộ gồm các chữ số ghi trên biên nhận thu tiền nước Sawaco',
  },
  {
    id: 'water_danang',
    categoryId: 'water',
    name: 'Cấp nước Đà Nẵng (Dawaco)',
    shortName: 'Dawaco',
    codeLabel: 'Mã khách hàng',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã định danh khách hàng do Dawaco cung cấp',
  },

  // ── Internet ──
  {
    id: 'internet_fpt',
    categoryId: 'internet',
    name: 'FPT Telecom',
    shortName: 'FPT',
    codeLabel: 'Mã hợp đồng / Số điện thoại',
    codePlaceholder: 'Nhập mã hợp đồng hoặc số điện thoại',
    codeHelper: 'Mã hợp đồng in trên biên bản bàn giao hoặc hợp đồng điện tử FPT',
  },
  {
    id: 'internet_viettel',
    categoryId: 'internet',
    name: 'Viettel Telecom (Internet)',
    shortName: 'Viettel Net',
    codeLabel: 'Số tài khoản / Mã thuê bao',
    codePlaceholder: 'Nhập mã thuê bao',
    codeHelper: 'Mã tài khoản FTTH hoặc tên tài khoản đường truyền cáp quang',
  },
  {
    id: 'internet_vnpt',
    categoryId: 'internet',
    name: 'VNPT - Vinaphone (Internet)',
    shortName: 'VNPT Net',
    codeLabel: 'Mã thuê bao / Mã thanh toán',
    codePlaceholder: 'Nhập mã thuê bao',
    codeHelper: 'Mã khách hàng ghi trên giấy báo cước dịch vụ viễn thông VNPT',
  },

  // ── Truyền hình ──
  {
    id: 'tv_kplus',
    categoryId: 'tv',
    name: 'Truyền hình K+',
    shortName: 'K+',
    codeLabel: 'Mã thẻ giải mã / Số thuê bao',
    codePlaceholder: 'Nhập mã thẻ hoặc số điện thoại',
    codeHelper: 'Dãy 12 số in trên thẻ giải mã K+ hoặc số điện thoại đăng ký',
  },
  {
    id: 'tv_vtvcab',
    categoryId: 'tv',
    name: 'Truyền hình Cáp VTVCab',
    shortName: 'VTVCab',
    codeLabel: 'Mã khách hàng',
    codePlaceholder: 'Nhập mã khách hàng',
    codeHelper: 'Mã khách hàng in trên hợp đồng hoặc tin nhắn nhắc cước VTVCab',
  },
  {
    id: 'tv_fptplay',
    categoryId: 'tv',
    name: 'Truyền hình FPT Play',
    shortName: 'FPT Play',
    codeLabel: 'Số điện thoại tài khoản',
    codePlaceholder: 'Nhập số điện thoại',
    codeHelper: 'Số điện thoại đăng ký gói dịch vụ truyền hình FPT Play',
  },

  // ── Di động trả sau ──
  {
    id: 'postpaid_viettel',
    categoryId: 'postpaid',
    name: 'Viettel Trả sau',
    shortName: 'Viettel',
    codeLabel: 'Số điện thoại trả sau',
    codePlaceholder: 'Nhập số điện thoại',
    codeHelper: 'Nhập số thuê bao Viettel đang sử dụng gói cước trả sau',
  },
  {
    id: 'postpaid_vina',
    categoryId: 'postpaid',
    name: 'VinaPhone Trả sau',
    shortName: 'VinaPhone',
    codeLabel: 'Số điện thoại trả sau',
    codePlaceholder: 'Nhập số điện thoại',
    codeHelper: 'Nhập số điện thoại VinaPhone hòa mạng gói cước trả sau',
  },
  {
    id: 'postpaid_mobi',
    categoryId: 'postpaid',
    name: 'MobiFone Trả sau',
    shortName: 'MobiFone',
    codeLabel: 'Số điện thoại trả sau',
    codePlaceholder: 'Nhập số điện thoại',
    codeHelper: 'Nhập số điện thoại MobiFone thuê bao trả sau',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Mock Invoices
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_INVOICES: BillInvoice[] = [
  // 1. Unpaid Electricity bill (Standard test)
  {
    id: 'inv_evn_01',
    providerId: 'evn_hanoi',
    customerCode: 'PE010008899',
    customerName: 'QUÝ NGUYỄN',
    customerAddress: 'Số 18 Hoàng Hoa Thám, Ba Đình, Hà Nội',
    billingPeriod: 'Kỳ 11/2026',
    amountDue: 1425000,
    fee: 0,
    dueDate: '28/11/2026',
    status: 'unpaid',
  },

  // 2. Unpaid Water bill
  {
    id: 'inv_water_01',
    providerId: 'water_sawaco',
    customerCode: 'SW998877',
    customerName: 'QUÝ NGUYỄN',
    customerAddress: '280 An Dương Vương, Phường 4, Quận 5, TP.HCM',
    billingPeriod: 'Kỳ 11/2026',
    amountDue: 285000,
    fee: 0,
    dueDate: '30/11/2026',
    status: 'unpaid',
  },

  // 3. Unpaid Internet bill
  {
    id: 'inv_net_01',
    providerId: 'internet_fpt',
    customerCode: 'SGN882910',
    customerName: 'QUÝ NGUYỄN',
    customerAddress: 'Gói Super250 · 280 An Dương Vương, Q.5, TP.HCM',
    billingPeriod: 'Tháng 11/2026',
    amountDue: 330000,
    fee: 0,
    dueDate: '25/11/2026',
    status: 'unpaid',
  },

  // 4. Unpaid Television bill
  {
    id: 'inv_tv_01',
    providerId: 'tv_kplus',
    customerCode: 'KP112233',
    customerName: 'QUÝ NGUYỄN',
    customerAddress: 'Gói Trọn Vẹn K+ HD (12 tháng)',
    billingPeriod: 'Gia hạn T11/2026',
    amountDue: 175000,
    fee: 0,
    dueDate: '29/11/2026',
    status: 'unpaid',
  },

  // 5. Unpaid Postpaid Mobile bill
  {
    id: 'inv_mob_01',
    providerId: 'postpaid_viettel',
    customerCode: '0988776655',
    customerName: 'QUÝ NGUYỄN',
    customerAddress: 'Gói cước V200X Trả sau',
    billingPeriod: 'Cước T11/2026',
    amountDue: 450000,
    fee: 0,
    dueDate: '27/11/2026',
    status: 'unpaid',
  },

  // 6. Already Paid bill (For testing duplicate payment blocking)
  {
    id: 'inv_paid_01',
    providerId: 'evn_hanoi',
    customerCode: 'PE010001234',
    customerName: 'TRẦN VĂN AN',
    customerAddress: 'Phố Đội Cấn, Ba Đình, Hà Nội',
    billingPeriod: 'Kỳ 10/2026',
    amountDue: 980000,
    fee: 0,
    dueDate: '20/10/2026',
    status: 'paid',
    paidAt: '18/10/2026',
  },

  // 7. High Balance Bill (For testing insufficient balance handling)
  {
    id: 'inv_high_01',
    providerId: 'evn_hcm',
    customerCode: 'PE029999999',
    customerName: 'CÔNG TY TNHH MEGA TECH VN',
    customerAddress: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
    billingPeriod: 'Kỳ 11/2026',
    amountDue: 250000000, // 250 triệu VND > số dư 148 triệu VND
    fee: 0,
    dueDate: '28/11/2026',
    status: 'unpaid',
  },
];

/**
 * Deterministic customer code lookup in mock invoice registry.
 * Case-insensitive match on customerCode + providerId.
 */
export function lookupMockInvoice(
  invoices: BillInvoice[],
  providerId: string,
  customerCode: string
): BillInvoice | null {
  const cleanCode = customerCode.trim().toUpperCase();
  const found = invoices.find(
    (inv) =>
      inv.providerId === providerId &&
      inv.customerCode.trim().toUpperCase() === cleanCode
  );
  return found || null;
}
