// ─────────────────────────────────────────────────────────────────────────────
// Financial Calculations — pure functions for Personal Finance Management
// ─────────────────────────────────────────────────────────────────────────────
import { Transaction } from '../types/banking';
import { FinanceCategoryId, CategoryOverride, Budget, RecurringExpense } from '../types/finance';
import { autoClassify, getCategoryById } from '../data/financeCategories';
import { parseTransactionDate } from './transactionHistory';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the effective category for a transaction, respecting manual overrides. */
export function classifyTransaction(tx: Transaction, overrides: CategoryOverride[]): FinanceCategoryId {
  const override = overrides.find((o) => o.transactionId === tx.id);
  return override ? override.categoryId : autoClassify(tx);
}

/** Is a category counted as income? */
export function isIncomeCategory(id: FinanceCategoryId): boolean {
  return getCategoryById(id).type === 'income';
}

/** Is a category counted as expense? */
export function isExpenseCategory(id: FinanceCategoryId): boolean {
  return getCategoryById(id).type === 'expense';
}

/**
 * Is a transaction eligible for calculations?
 * - status must be 'success' or absent
 * - excludes 'transfer_out' type transactions from expense totals (they are 'neutral')
 */
export function isEligible(tx: Transaction): boolean {
  const status = (tx as unknown as Record<string, unknown>).status;
  if (status !== undefined && status !== 'success') return false;
  return true;
}

/** Parse 'YYYY-MM' into year/month numbers. */
function parseYearMonth(month: string): { year: number; month: number } {
  const parts = month.split('-');
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
}

/** Get all eligible transactions for a given 'YYYY-MM' month. */
export function getMonthTransactions(transactions: Transaction[], month: string): Transaction[] {
  const { year, month: m } = parseYearMonth(month);
  return transactions.filter((tx) => {
    if (!isEligible(tx)) return false;
    const d = parseTransactionDate(tx);
    return d.getFullYear() === year && d.getMonth() + 1 === m;
  });
}

// ── Monthly Summary ───────────────────────────────────────────────────────────

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
}

export function calcMonthlySummary(
  transactions: Transaction[],
  month: string,
  overrides: CategoryOverride[]
): MonthlySummary {
  const txs = getMonthTransactions(transactions, month);
  let totalIncome = 0;
  let totalExpense = 0;
  for (const tx of txs) {
    const catId = classifyTransaction(tx, overrides);
    const amt = Math.abs(tx.amount);
    if (isIncomeCategory(catId)) totalIncome += amt;
    else if (isExpenseCategory(catId)) totalExpense += amt;
  }
  return { totalIncome, totalExpense, netFlow: totalIncome - totalExpense };
}

// ── Category Breakdown ────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  categoryId: FinanceCategoryId;
  total: number;
  count: number;
}

export function calcCategoryBreakdown(
  transactions: Transaction[],
  month: string,
  overrides: CategoryOverride[]
): CategoryBreakdown[] {
  const txs = getMonthTransactions(transactions, month);
  const map = new Map<FinanceCategoryId, CategoryBreakdown>();
  for (const tx of txs) {
    const catId = classifyTransaction(tx, overrides);
    if (!isExpenseCategory(catId)) continue;
    const existing = map.get(catId);
    const amt = Math.abs(tx.amount);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
    } else {
      map.set(catId, { categoryId: catId, total: amt, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// ── Budget Progress ───────────────────────────────────────────────────────────

export interface BudgetProgress {
  spent: number;
  remaining: number;
  percent: number;
}

export function calcBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  overrides: CategoryOverride[]
): BudgetProgress {
  const txs = getMonthTransactions(transactions, budget.month);
  let spent = 0;
  for (const tx of txs) {
    const catId = classifyTransaction(tx, overrides);
    if (catId === budget.categoryId) {
      spent += Math.abs(tx.amount);
    }
  }
  const remaining = Math.max(0, budget.limit - spent);
  const percent = budget.limit > 0 ? Math.min(1, spent / budget.limit) : 0;
  return { spent, remaining, percent };
}

// ── Weekly Trend ──────────────────────────────────────────────────────────────

export interface WeekPoint {
  weekLabel: string;
  amount: number;
}

/** Returns 4 weeks of spending for the given 'YYYY-MM' month. */
export function calcWeeklyTrend(
  transactions: Transaction[],
  month: string,
  overrides: CategoryOverride[]
): WeekPoint[] {
  const { year, month: m } = parseYearMonth(month);
  const points: WeekPoint[] = [
    { weekLabel: 'T1', amount: 0 },
    { weekLabel: 'T2', amount: 0 },
    { weekLabel: 'T3', amount: 0 },
    { weekLabel: 'T4', amount: 0 },
  ];
  for (const tx of transactions) {
    if (!isEligible(tx)) continue;
    const catId = classifyTransaction(tx, overrides);
    if (!isExpenseCategory(catId)) continue;
    const d = parseTransactionDate(tx);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== m) continue;
    const dayOfMonth = d.getDate();
    const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
    points[weekIndex].amount += Math.abs(tx.amount);
  }
  const labels = ['1-7', '8-14', '15-21', '22+'];
  return points.map((p, i) => ({
    weekLabel: labels[i],
    amount: p.amount,
  }));
}

// ── Insights ──────────────────────────────────────────────────────────────────

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  body: string;
}

export function generateInsights(
  transactions: Transaction[],
  currentMonth: string,
  prevMonth: string,
  budgets: Budget[],
  recurringExpenses: RecurringExpense[],
  overrides: CategoryOverride[]
): Insight[] {
  const insights: Insight[] = [];
  const curr = calcMonthlySummary(transactions, currentMonth, overrides);
  const prev = calcMonthlySummary(transactions, prevMonth, overrides);

  // Income vs last month
  if (prev.totalIncome > 0 && curr.totalIncome > prev.totalIncome) {
    const diffPct = Math.round(((curr.totalIncome - prev.totalIncome) / prev.totalIncome) * 100);
    insights.push({
      id: 'income_up',
      type: 'positive',
      title: 'Thu nhập tăng trưởng',
      body: `Thu nhập tháng này tăng ${diffPct}% so với tháng trước.`,
    });
  }
  if (prev.totalExpense > 0 && curr.totalExpense > prev.totalExpense * 1.1) {
    const diffPct = Math.round(((curr.totalExpense - prev.totalExpense) / prev.totalExpense) * 100);
    insights.push({
      id: 'expense_up',
      type: 'warning',
      title: 'Chi tiêu tăng cao',
      body: `Chi tiêu tháng này tăng ${diffPct}% so với tháng trước.`,
    });
  }

  // Budget overruns
  for (const b of budgets) {
    if (b.month !== currentMonth) continue;
    const { percent } = calcBudgetProgress(b, transactions, overrides);
    const cat = getCategoryById(b.categoryId);
    if (percent >= 1) {
      insights.push({
        id: `budget_over_${b.id}`,
        type: 'warning',
        title: `Vượt ngân sách: ${cat.label}`,
        body: `Chi tiêu cho danh mục "${cat.label}" đã vượt hạn mức đã đặt.`,
      });
    } else if (percent >= 0.8) {
      insights.push({
        id: `budget_near_${b.id}`,
        type: 'info',
        title: `Tiệm cận ngân sách: ${cat.label}`,
        body: `Đã sử dụng ${Math.round(percent * 100)}% ngân sách cho mục "${cat.label}".`,
      });
    }
  }

  // Upcoming recurring expenses
  const upcoming = recurringExpenses.filter((r) => !r.paidThisCycle);
  if (upcoming.length > 0) {
    insights.push({
      id: 'recurring_due',
      type: 'info',
      title: `${upcoming.length} khoản định kỳ trong tháng`,
      body: `Có ${upcoming.length} khoản chi định kỳ chưa đánh dấu thanh toán trong chu kỳ này.`,
    });
  }

  if (curr.netFlow > 0 && curr.totalIncome > 0) {
    insights.push({
      id: 'positive_net',
      type: 'positive',
      title: 'Dòng tiền dương',
      body: 'Thu nhập tháng này đang cao hơn chi tiêu.',
    });
  }

  return insights.slice(0, 5);
}

// ── Month-over-month comparison ───────────────────────────────────────────────

export interface MonthComparison {
  incomeDiffPct: number | null;
  expenseDiffPct: number | null;
  prevIncome: number;
  prevExpense: number;
}

export function calcMonthComparison(
  transactions: Transaction[],
  currentMonth: string,
  prevMonth: string,
  overrides: CategoryOverride[]
): MonthComparison {
  const curr = calcMonthlySummary(transactions, currentMonth, overrides);
  const prev = calcMonthlySummary(transactions, prevMonth, overrides);

  const incomeDiffPct =
    prev.totalIncome > 0
      ? Math.round(((curr.totalIncome - prev.totalIncome) / prev.totalIncome) * 100)
      : null;
  const expenseDiffPct =
    prev.totalExpense > 0
      ? Math.round(((curr.totalExpense - prev.totalExpense) / prev.totalExpense) * 100)
      : null;

  return {
    incomeDiffPct,
    expenseDiffPct,
    prevIncome: prev.totalIncome,
    prevExpense: prev.totalExpense,
  };
}

// ── Month navigation helpers ──────────────────────────────────────────────────

export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function prevMonthStr(month: string): string {
  const { year, month: m } = parseYearMonth(month);
  if (m === 1) return `${year - 1}-12`;
  return `${year}-${String(m - 1).padStart(2, '0')}`;
}

export function nextMonthStr(month: string): string {
  const { year, month: m } = parseYearMonth(month);
  if (m === 12) return `${year + 1}-01`;
  return `${year}-${String(m + 1).padStart(2, '0')}`;
}

export function formatMonthDisplay(month: string): string {
  const { year, month: m } = parseYearMonth(month);
  return `Tháng ${m}/${year}`;
}
