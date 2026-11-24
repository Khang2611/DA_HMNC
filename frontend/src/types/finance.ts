// ─────────────────────────────────────────────────────────────────────────────
// Finance types — Mauve Banking Personal Finance Management
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

export type FinanceIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type FinanceCategoryId =
  // Expense categories
  | 'food'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other_expense'
  // Income categories
  | 'salary'
  | 'bonus'
  | 'interest_income'
  | 'other_income'
  // Neutral (excluded from income/expense totals)
  | 'transfer_out'
  | 'uncategorized';

export type FinanceCategoryType = 'expense' | 'income' | 'neutral';

export interface FinanceCategory {
  id: FinanceCategoryId;
  label: string;
  type: FinanceCategoryType;
  color: string;
  Icon: FinanceIconComponent;
}

export interface CategoryOverride {
  transactionId: string;
  categoryId: FinanceCategoryId;
}

export interface Budget {
  id: string;
  categoryId: FinanceCategoryId;
  month: string; // 'YYYY-MM'
  limit: number;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // 'DD/MM/YYYY'
  createdAt: string;
  completedAt?: string;
  color: string;
}

export type RecurrenceRule = 'monthly' | 'weekly' | 'yearly';

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  categoryId: FinanceCategoryId;
  recurrenceRule: RecurrenceRule;
  nextDueDate: string; // 'DD/MM/YYYY'
  paidThisCycle: boolean;
  createdAt: string;
}

export interface FinanceState {
  categoryOverrides: CategoryOverride[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringExpenses: RecurringExpense[];
}
