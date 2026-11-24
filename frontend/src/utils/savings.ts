/**
 * Savings & Interest Calculation Utility — Mauve Banking
 * Implements calendar-accurate simple interest for fixed-term banking deposits:
 *   interest = principal × annualRate × actualTermDays / 365
 *
 * All interest rates are stored as decimal values (e.g. 0.050 for 5.0%/year).
 * Mock rates are clearly labeled as DEMO rates.
 */

import { MaturityInstruction, SavingsStatus } from '../types/banking';

export interface SavingsTermConfig {
  termMonths: number;
  label: string;
  annualRate: number; // Decimal: 0.050 = 5.0%
  rateDisplay: string; // "5.0%"
  isPopular?: boolean;
}

/**
 * Configurable mock term rates for fixed-term online savings.
 * Labeled DEMO — for simulation purposes.
 */
export const SAVINGS_TERMS: SavingsTermConfig[] = [
  { termMonths: 1,  label: '1 tháng',  annualRate: 0.032, rateDisplay: '3.2%' },
  { termMonths: 3,  label: '3 tháng',  annualRate: 0.038, rateDisplay: '3.8%' },
  { termMonths: 6,  label: '6 tháng',  annualRate: 0.050, rateDisplay: '5.0%', isPopular: true },
  { termMonths: 9,  label: '9 tháng',  annualRate: 0.053, rateDisplay: '5.3%' },
  { termMonths: 12, label: '12 tháng', annualRate: 0.058, rateDisplay: '5.8%', isPopular: true },
];

/**
 * Non-term interest rate applied upon early withdrawal (không kỳ hạn).
 * By regulation, early settlement forfeits term rate and applies non-term rate (0.5% / year).
 */
export const NON_TERM_ANNUAL_RATE = 0.005; // 0.5% / year

/** Minimum deposit amount to open a savings book */
export const MIN_DEPOSIT_AMOUNT = 1000000; // 1,000,000 ₫

/**
 * Formats a JavaScript Date as DD/MM/YYYY.
 */
export function formatDateVN(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Parses a DD/MM/YYYY date string into a Date object.
 */
export function parseDateVN(str: string): Date {
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(str);
}

/**
 * Calculates maturity date by adding termMonths to startDate.
 */
export function calculateMaturityDate(startDate: Date, termMonths: number): Date {
  const maturity = new Date(startDate.getTime());
  maturity.setMonth(maturity.getMonth() + termMonths);
  return maturity;
}

/**
 * Calculates calendar days between two dates.
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.max(1, Math.round((endUTC - startUTC) / msPerDay));
}

/**
 * Calculates estimated term interest:
 *   interest = principal × annualRate × actualTermDays / 365
 */
export function calculateEstimatedInterest(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date = new Date()
): {
  interest: number;
  actualTermDays: number;
  maturityDate: Date;
} {
  const maturityDate = calculateMaturityDate(startDate, termMonths);
  const actualTermDays = calculateDaysBetween(startDate, maturityDate);
  const interest = Math.round((principal * annualRate * actualTermDays) / 365);
  return { interest, actualTermDays, maturityDate };
}

/**
 * Calculates settlement interest upon closing a savings account:
 * - If settlementDate < maturityDate: Early withdrawal, applies non-term rate (0.5%/year)
 *   on actual elapsed days.
 * - If settlementDate >= maturityDate: Matured, applies full agreed term rate.
 */
export function calculateSettlementInterest(
  principal: number,
  annualRate: number,
  startDate: Date,
  maturityDate: Date,
  settlementDate: Date = new Date()
): {
  isEarlyWithdrawal: boolean;
  appliedRate: number;
  elapsedDays: number;
  interestEarned: number;
  totalPayout: number;
} {
  // If settled on or after maturity date
  const isEarlyWithdrawal = settlementDate < maturityDate;
  const appliedRate = isEarlyWithdrawal ? NON_TERM_ANNUAL_RATE : annualRate;

  const elapsedDays = isEarlyWithdrawal
    ? calculateDaysBetween(startDate, settlementDate)
    : calculateDaysBetween(startDate, maturityDate);

  const interestEarned = Math.round((principal * appliedRate * elapsedDays) / 365);
  const totalPayout = principal + interestEarned;

  return {
    isEarlyWithdrawal,
    appliedRate,
    elapsedDays,
    interestEarned,
    totalPayout,
  };
}

/**
 * Human-readable label for maturity instruction.
 */
export function getMaturityInstructionLabel(instruction: MaturityInstruction): string {
  switch (instruction) {
    case 'transfer_all':
      return 'Chuyển gốc và lãi về tài khoản';
    case 'renew_principal':
      return 'Tái tục gốc, chuyển lãi về tài khoản';
    case 'renew_all':
      return 'Tái tục cả gốc và lãi';
    default:
      return 'Chuyển gốc và lãi về tài khoản';
  }
}

/**
 * Status display badge properties.
 */
export function getSavingsStatusConfig(status: SavingsStatus): {
  text: string;
  color: string;
  bg: string;
  borderColor: string;
} {
  switch (status) {
    case 'active':
      return {
        text: 'Đang sinh lời',
        color: '#32D74B', // incomeGreen
        bg: 'rgba(52, 199, 89, 0.12)',
        borderColor: 'rgba(52, 199, 89, 0.28)',
      };
    case 'matured':
      return {
        text: 'Đến hạn tất toán',
        color: '#FF9500', // warning
        bg: 'rgba(255, 149, 0, 0.12)',
        borderColor: 'rgba(255, 149, 0, 0.30)',
      };
    case 'settled':
      return {
        text: 'Đã tất toán',
        color: '#C1A0AC', // secondary
        bg: 'rgba(193, 160, 172, 0.12)',
        borderColor: 'rgba(193, 160, 172, 0.22)',
      };
  }
}
