/**
 * Transaction History Utilities
 *
 * Pure functions for searching, filtering, date range calculation,
 * sorting, grouping, and summary totals for Mauve Banking.
 */

import { Transaction } from '../types/banking';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DatePreset = '7_days' | '30_days' | '90_days' | 'custom' | 'all';
export type TypeFilter = 'all' | 'in' | 'out';

export interface FilterParams {
  accountId: string; // 'all' or specific account.id
  cardId?: string; // specific cardId if filtering by card
  datePreset: DatePreset;
  customStart?: Date;
  customEnd?: Date;
  typeFilter: TypeFilter;
  searchQuery: string;
}

export interface DateGroupSection {
  title: string;
  date: Date;
  data: Transaction[];
}

// ─────────────────────────────────────────────────────────────────────────────
// String Normalization for Diacritic-Insensitive Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove Vietnamese diacritics and convert to lower case for search matching.
 * e.g. "Nguyễn Lan Hương" -> "nguyen lan huong"
 *      "Tiết kiệm" -> "tiet kiem"
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Date Parsing & Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust date parser for transactions.
 * Prefers structured ISO `createdAt`.
 * If missing, parses human-readable mock timestamps like "Hôm nay, 14:28", "Hôm qua", or "19/11/2026".
 */
export function parseTransactionDate(tx: Transaction): Date {
  if (tx.createdAt) {
    const d = new Date(tx.createdAt);
    if (!isNaN(d.getTime())) return d;
  }

  const raw = (tx.timestamp || '').trim();

  // 1. "Vừa xong" -> current moment
  if (/vừa xong/i.test(raw)) {
    return new Date();
  }

  // 2. "Hôm nay, HH:mm"
  const todayMatch = raw.match(/hôm nay(?:,\s*(\d{1,2}):(\d{2}))?/i);
  if (todayMatch) {
    const d = new Date();
    if (todayMatch[1] && todayMatch[2]) {
      d.setHours(parseInt(todayMatch[1], 10), parseInt(todayMatch[2], 10), 0, 0);
    }
    return d;
  }

  // 3. "Hôm qua, HH:mm"
  const yesterdayMatch = raw.match(/hôm qua(?:,\s*(\d{1,2}):(\d{2}))?/i);
  if (yesterdayMatch) {
    const d = new Date(Date.now() - 86400000);
    if (yesterdayMatch[1] && yesterdayMatch[2]) {
      d.setHours(parseInt(yesterdayMatch[1], 10), parseInt(yesterdayMatch[2], 10), 0, 0);
    }
    return d;
  }

  // 4. "DD/MM/YYYY" or "DD/MM/YYYY, HH:mm"
  const dmyMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

/**
 * Format a Date for SectionList headers.
 * Returns "Hôm nay", "Hôm qua", or "DD/MM/YYYY".
 */
export function formatDateGroupHeader(date: Date): string {
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Hôm nay';

  const yesterday = new Date(now.getTime() - 86400000);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Hôm qua';

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Formats date into DD/MM/YYYY
 */
export function formatDateDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Formats full timestamp for detail view, e.g. "14:28:00 - 22/11/2026"
 */
export function formatDetailDateTime(tx: Transaction): string {
  const d = parseTransactionDate(tx);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date Range Checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether a given transaction date falls within the selected preset or custom range.
 * Respects local date boundaries: start of day (00:00:00) to end of day (23:59:59.999).
 */
export function isWithinDateRange(
  txDate: Date,
  preset: DatePreset,
  customStart?: Date,
  customEnd?: Date
): boolean {
  if (preset === 'all') return true;

  const now = new Date();
  const txTime = txDate.getTime();

  if (preset === '7_days') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return txTime >= start.getTime() && txTime <= end.getTime();
  }

  if (preset === '30_days') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return txTime >= start.getTime() && txTime <= end.getTime();
  }

  if (preset === '90_days') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return txTime >= start.getTime() && txTime <= end.getTime();
  }

  if (preset === 'custom' && customStart && customEnd) {
    const start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 0, 0, 0, 0);
    const end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999);
    return txTime >= start.getTime() && txTime <= end.getTime();
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Macro Financial Summary Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates macro Tiền vào (incoming) and Tiền ra (outgoing) totals
 * for the selected Account and Date Range.
 *
 * NOTE: As required, search text and display type filter ('all'/'in'/'out')
 * do NOT unexpectedly change the overall period totals.
 */
export function calculateTransactionSummary(
  transactions: Transaction[],
  accountId: string,
  datePreset: DatePreset,
  customStart?: Date,
  customEnd?: Date,
  cardId?: string
): { totalIn: number; totalOut: number } {
  let totalIn = 0;
  let totalOut = 0;

  for (const tx of transactions) {
    // 1. Account filter
    if (accountId !== 'all') {
      if (tx.accountId !== accountId) continue;
    }

    // 1b. Card filter (when filtering specifically by card)
    if (cardId) {
      if (tx.cardId !== cardId) continue;
    }

    // 2. Date range filter
    const txDate = parseTransactionDate(tx);
    if (!isWithinDateRange(txDate, datePreset, customStart, customEnd)) {
      continue;
    }

    // 3. Accumulate totals
    if (tx.amount > 0) {
      totalIn += tx.amount;
    } else {
      totalOut += Math.abs(tx.amount);
    }
  }

  return { totalIn, totalOut };
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Filtering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter transactions by Account, Date, Type, and Search Query.
 */
export function filterTransactions(
  transactions: Transaction[],
  params: FilterParams
): Transaction[] {
  const { accountId, cardId, datePreset, customStart, customEnd, typeFilter, searchQuery } = params;
  const normalizedQuery = removeVietnameseDiacritics(searchQuery);

  return transactions.filter((tx) => {
    // 1. Account filter:
    // When an individual account is selected, only transactions associated with that account are shown.
    // Unassociated transactions (no accountId) appear only when 'all' is selected.
    if (accountId !== 'all') {
      if (tx.accountId !== accountId) return false;
    }

    // 1b. Card filter:
    if (cardId) {
      if (tx.cardId !== cardId) return false;
    }

    // 2. Date filter:
    const txDate = parseTransactionDate(tx);
    if (!isWithinDateRange(txDate, datePreset, customStart, customEnd)) {
      return false;
    }

    // 3. Type filter:
    if (typeFilter === 'in' && tx.amount <= 0) return false;
    if (typeFilter === 'out' && tx.amount >= 0) return false;

    // 4. Search query filter (case-insensitive & diacritic-insensitive)
    if (normalizedQuery.length > 0) {
      const matchTitle = removeVietnameseDiacritics(tx.title).includes(normalizedQuery);
      const matchCategory = removeVietnameseDiacritics(tx.category).includes(normalizedQuery);
      const matchRecipient = tx.recipientName
        ? removeVietnameseDiacritics(tx.recipientName).includes(normalizedQuery)
        : false;
      const matchBank = tx.recipientBank
        ? removeVietnameseDiacritics(tx.recipientBank).includes(normalizedQuery)
        : false;
      const matchSender = tx.senderName
        ? removeVietnameseDiacritics(tx.senderName).includes(normalizedQuery)
        : false;
      const matchNote = tx.note
        ? removeVietnameseDiacritics(tx.note).includes(normalizedQuery)
        : false;
      const matchRef = tx.referenceCode
        ? removeVietnameseDiacritics(tx.referenceCode).includes(normalizedQuery)
        : false;
      const matchId = removeVietnameseDiacritics(tx.id).includes(normalizedQuery);

      if (!matchTitle && !matchCategory && !matchRecipient && !matchBank && !matchSender && !matchNote && !matchRef && !matchId) {
        return false;
      }
    }

    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouping for SectionList
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sorts transactions newest first and groups them by formatted date header.
 */
export function groupTransactionsByDate(transactions: Transaction[]): DateGroupSection[] {
  // Sort descending by timestamp
  const sorted = [...transactions].sort((a, b) => {
    const timeA = parseTransactionDate(a).getTime();
    const timeB = parseTransactionDate(b).getTime();
    return timeB - timeA;
  });

  const groups: { [key: string]: { date: Date; data: Transaction[] } } = {};
  const order: string[] = [];

  for (const tx of sorted) {
    const txDate = parseTransactionDate(tx);
    const key = formatDateGroupHeader(txDate);

    if (!groups[key]) {
      groups[key] = { date: txDate, data: [] };
      order.push(key);
    }
    groups[key].data.push(tx);
  }

  return order.map((key) => ({
    title: key,
    date: groups[key].date,
    data: groups[key].data,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Display Helper for Transaction Type
// ─────────────────────────────────────────────────────────────────────────────

export function getTransactionTypeLabel(type: Transaction['type']): string {
  switch (type) {
    case 'transfer_out':
      return 'Chuyển tiền';
    case 'transfer_in':
      return 'Nhận chuyển khoản';
    case 'payment':
      return 'Thanh toán dịch vụ';
    case 'interest':
      return 'Trả lãi tiết kiệm';
    case 'topup':
      return 'Nạp tiền điện thoại';
    case 'data_package':
      return 'Mua gói cước Data / 5G';
    default:
      return 'Giao dịch';
  }
}
