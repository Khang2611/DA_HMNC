/**
 * Mauve Banking — Shared Product Registry
 *
 * Single source of truth for all banking products.
 * Used by: ProductCatalogScreen, QuickActionsGrid, CustomizeScreen, navigation routing.
 *
 * Availability is based on actual implemented screens only.
 * Do NOT mark a product as 'available' unless a working screen exists.
 */

import React from 'react';
import {
  ArrowLeftRight,
  Smartphone,
  Wallet,
  History,
  PieChart,
  PiggyBank,
  CreditCard,
  Receipt,
  Landmark,
  Banknote,
  WalletCards,
} from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProductId =
  | 'transfer'
  | 'mobile'
  | 'accounts'
  | 'history'
  | 'analytics'
  | 'savings'
  | 'cards'
  | 'bills'
  | 'ewallet'
  | 'public_services'
  | 'quick_loan';

export type ProductStatus = 'available' | 'coming_soon';

export type ProductCategory =
  | 'payment'
  | 'account'
  | 'savings_cards'
  | 'other';

export interface Product {
  id: ProductId;
  label: string;
  categoryId: ProductCategory;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  status: ProductStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Category metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductCategory_Meta {
  id: ProductCategory;
  title: string;
}

export const PRODUCT_CATEGORIES: ProductCategory_Meta[] = [
  { id: 'payment',       title: 'Thanh toán & Chuyển tiền'          },
  { id: 'account',       title: 'Tài khoản & Quản lý tài chính'     },
  { id: 'savings_cards', title: 'Tiết kiệm & Thẻ'                   },
  { id: 'other',         title: 'Dịch vụ khác'                      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Product registry
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  // ── Thanh toán & Chuyển tiền ──────────────────────────────────────────────
  {
    id: 'transfer',
    label: 'Chuyển tiền',
    categoryId: 'payment',
    Icon: ArrowLeftRight,
    status: 'available',
  },
  {
    id: 'mobile',
    label: 'Nạp điện thoại',
    categoryId: 'payment',
    Icon: Smartphone,
    status: 'available',
  },
  {
    id: 'bills',
    label: 'Thanh toán hóa đơn',
    categoryId: 'payment',
    Icon: Receipt,
    status: 'available',
  },
  {
    id: 'ewallet',
    label: 'Nạp ví điện tử',
    categoryId: 'payment',
    Icon: WalletCards,
    status: 'available',
  },

  // ── Tài khoản & Quản lý tài chính ────────────────────────────────────────
  {
    id: 'accounts',
    label: 'Tài khoản',
    categoryId: 'account',
    Icon: Wallet,
    status: 'available',
  },
  {
    id: 'history',
    label: 'Lịch sử giao dịch',
    categoryId: 'account',
    Icon: History,
    status: 'available',
  },
  {
    id: 'analytics',
    label: 'Quản lý tài chính',
    categoryId: 'account',
    Icon: PieChart,
    status: 'available',
  },

  // ── Tiết kiệm & Thẻ ──────────────────────────────────────────────────────
  {
    id: 'savings',
    label: 'Tiết kiệm',
    categoryId: 'savings_cards',
    Icon: PiggyBank,
    status: 'available',
  },
  {
    id: 'cards',
    label: 'Thẻ',
    categoryId: 'savings_cards',
    Icon: CreditCard,
    status: 'available',
  },

  // ── Dịch vụ khác ─────────────────────────────────────────────────────────
  {
    id: 'public_services',
    label: 'Dịch vụ công',
    categoryId: 'other',
    Icon: Landmark,
    status: 'coming_soon',
  },
  {
    id: 'quick_loan',
    label: 'Vay nhanh',
    categoryId: 'other',
    Icon: Banknote,
    status: 'coming_soon',
  },
];

/** Lookup by ID — O(1) for navigation routing */
export const PRODUCT_MAP = new Map<ProductId, Product>(
  PRODUCTS.map((p) => [p.id, p])
);

/** Default four quick actions displayed on Home (first-launch defaults) */
export const DEFAULT_QUICK_ACTION_IDS: ProductId[] = [
  'transfer',
  'mobile',
  'savings',
  'cards',
];

// ─────────────────────────────────────────────────────────────────────────────
// Preference validation helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a raw array of stored IDs (possibly corrupt/invalid/duplicate),
 * returns exactly 4 valid, unique ProductIds.
 * Fills missing slots from DEFAULT_QUICK_ACTION_IDS, then remaining PRODUCTS.
 */
export function sanitizeQuickActionIds(raw: unknown): ProductId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_QUICK_ACTION_IDS];

  const validIds = new Set(PRODUCTS.map((p) => p.id));
  const seen = new Set<ProductId>();
  const result: ProductId[] = [];

  for (const item of raw) {
    if (typeof item === 'string' && validIds.has(item as ProductId) && !seen.has(item as ProductId)) {
      seen.add(item as ProductId);
      result.push(item as ProductId);
      if (result.length === 4) return result;
    }
  }

  // Fill gaps from defaults, then from all products
  const fillOrder: ProductId[] = [
    ...DEFAULT_QUICK_ACTION_IDS,
    ...PRODUCTS.map((p) => p.id),
  ];
  for (const id of fillOrder) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
      if (result.length === 4) return result;
    }
  }

  return result;
}
