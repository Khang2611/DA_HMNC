/**
 * FinancialManagementScreen — Quản lý tài chính
 * Mauve Banking · Personal Finance Management Module
 *
 * Refactored to adhere to Mauve Glass design system:
 * - Single continuous dark background (Palette.bg = '#16131F')
 * - Complete removal of emoji UI; strictly Lucide icons (strokeWidth=1.75, size=16-18)
 * - Compact header with proper safeTop and natural month selector
 * - Horizontal auto-scrolling tab bar with restrained active styling
 * - Solid-surface, keyboard-safe modal bottom-sheets (no background bleed-through)
 * - Complete CRUD for Budgets, Savings Goals, and Recurring Expenses (Add, Edit, Delete)
 * - Subtle, data-backed Financial Reporting & Insights
 * - Restrained typography and spacing matching approved banking screens
 */

import React, { useState, useMemo, useRef, ComponentRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Rect, Text as SvgText, G } from 'react-native-svg';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Repeat,
  TrendingUp,
  Lightbulb,
  BarChart2,
  Check,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  PieChart,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { ScreenHeader } from '../components/ScreenHeader';
import { Transaction, Account, SavingsAccount } from '../types/banking';
import {
  FinanceState,
  FinanceCategoryId,
  Budget,
  SavingsGoal,
  RecurringExpense,
  CategoryOverride,
} from '../types/finance';
import { FINANCE_CATEGORIES, getCategoryById } from '../data/financeCategories';
import {
  classifyTransaction,
  calcMonthlySummary,
  calcCategoryBreakdown,
  calcBudgetProgress,
  calcWeeklyTrend,
  calcMonthComparison,
  generateInsights,
  getCurrentMonth,
  prevMonthStr,
  nextMonthStr,
  formatMonthDisplay,
  getMonthTransactions,
  isExpenseCategory,
} from '../utils/financialCalculations';
import { formatVNDInput, parseVNDInput } from '../utils/formatters';
import { ConfirmationBottomSheet } from '../components/ConfirmationBottomSheet';
import { FeedbackDialog, FeedbackVariant } from '../components/FeedbackDialog';

// ── Types & Constants ────────────────────────────────────────────────────────

type TabId = 'overview' | 'budget' | 'goals' | 'recurring' | 'insights';

interface TabItem {
  id: TabId;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'overview',  label: 'Tổng quan' },
  { id: 'budget',    label: 'Ngân sách' },
  { id: 'goals',     label: 'Mục tiêu' },
  { id: 'recurring', label: 'Định kỳ' },
  { id: 'insights',  label: 'Gợi ý' },
];

export interface FinancialManagementScreenProps {
  transactions: Transaction[];
  accounts: Account[];
  savingsAccounts: SavingsAccount[];
  financeState: FinanceState;
  onUpdateFinanceState: (updated: FinanceState) => void;
  onClose: () => void;
}

const GOAL_COLORS = ['#806C79', '#C1A0AC', '#32D74B', '#64D2FF', '#FF9F0A', '#BF5AF2'];

// ── Currency Helpers ─────────────────────────────────────────────────────────

function formatVND(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000) {
    const val = absAmount / 1_000_000;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)} tr ₫`;
  }
  if (absAmount >= 1_000) {
    return `${Math.round(absAmount / 1_000)} k ₫`;
  }
  return `${absAmount.toLocaleString('vi-VN')} ₫`;
}

function formatVNDFull(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── SVG Mini Bar Chart ────────────────────────────────────────────────────────

function MiniBarChart({
  data,
  color = Palette.primary,
}: {
  data: { label: string; amount: number }[];
  color?: string;
}) {
  const W = 280;
  const H = 70;
  const barW = 34;
  const gap = (W - data.length * barW) / (data.length + 1);
  const maxVal = Math.max(...data.map((d) => d.amount), 1);

  return (
    <Svg width={W} height={H + 20}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.amount / maxVal) * H);
        const x = gap + i * (barW + gap);
        const y = H - barH;
        return (
          <G key={d.label}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              opacity={d.amount > 0 ? 0.9 : 0.2}
            />
            <SvgText
              x={x + barW / 2}
              y={H + 14}
              fontSize={10}
              fill={Palette.secondary}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Refined Progress Bar ──────────────────────────────────────────────────────

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(100, Math.round(percent * 100))}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// ── Clean Category Picker Modal ───────────────────────────────────────────────

interface CategoryPickerProps {
  visible: boolean;
  onSelect: (id: FinanceCategoryId) => void;
  onClose: () => void;
  expenseOnly?: boolean;
  current?: FinanceCategoryId;
}

function CategoryPickerModal({
  visible,
  onSelect,
  onClose,
  expenseOnly,
  current,
}: CategoryPickerProps) {
  const insets = useSafeAreaInsets();
  const cats = expenseOnly
    ? FINANCE_CATEGORIES.filter((c) => c.type === 'expense')
    : FINANCE_CATEGORIES.filter((c) => c.type !== 'neutral');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.bottomSheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <View style={styles.sheetSolidCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Chọn danh mục</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.sheetCloseBtn}>
                <X size={18} color={Palette.secondary} strokeWidth={1.75} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 380 }}
            >
              {cats.map((c) => {
                const CatIcon = c.Icon;
                const isSelected = current === c.id;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.pickerRow, isSelected && styles.pickerRowActive]}
                    onPress={() => {
                      onSelect(c.id);
                      onClose();
                    }}
                  >
                    <View style={[styles.categoryIconCircle, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                      <CatIcon size={16} color={c.color} strokeWidth={1.75} />
                    </View>
                    <Text style={styles.pickerLabel}>{c.label}</Text>
                    {isSelected && (
                      <Check size={16} color={Palette.incomeGreen} strokeWidth={2} style={{ marginLeft: 'auto' }} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function FinancialManagementScreen({
  transactions,
  financeState,
  onUpdateFinanceState,
  onClose,
}: FinancialManagementScreenProps) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const tabScrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);

  // ── Override category modal ──
  const [overrideTx, setOverrideTx] = useState<Transaction | null>(null);

  // ── Budget CRUD State ──
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetCat, setBudgetCat] = useState<FinanceCategoryId | null>(null);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [showBudgetCatPicker, setShowBudgetCatPicker] = useState(false);

  // ── Goal CRUD State ──
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);

  // ── Goal Progress Modal ──
  const [addGoalId, setAddGoalId] = useState<string | null>(null);
  const [addGoalAmount, setAddGoalAmount] = useState('');

  // ── Recurring CRUD State ──
  const [showRecurForm, setShowRecurForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [recurTitle, setRecurTitle] = useState('');
  const [recurAmount, setRecurAmount] = useState('');
  const [recurCat, setRecurCat] = useState<FinanceCategoryId | null>(null);
  const [recurRule, setRecurRule] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [recurDate, setRecurDate] = useState('');
  const [showRecurCatPicker, setShowRecurCatPicker] = useState(false);

  // ── Standardized Feedback & Confirmation Dialogs ──
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [feedback, setFeedback] = useState<{
    visible: boolean;
    variant: FeedbackVariant;
    title: string;
    message?: string;
  }>({
    visible: false,
    variant: 'info',
    title: '',
  });

  const prevMonth = prevMonthStr(currentMonth);

  // ── Derived Data ──────────────────────────────────────────────────────────
  const summary = useMemo(
    () => calcMonthlySummary(transactions, currentMonth, financeState.categoryOverrides),
    [transactions, currentMonth, financeState.categoryOverrides]
  );
  const breakdown = useMemo(
    () => calcCategoryBreakdown(transactions, currentMonth, financeState.categoryOverrides),
    [transactions, currentMonth, financeState.categoryOverrides]
  );
  const weeklyTrend = useMemo(
    () => calcWeeklyTrend(transactions, currentMonth, financeState.categoryOverrides),
    [transactions, currentMonth, financeState.categoryOverrides]
  );
  const comparison = useMemo(
    () => calcMonthComparison(transactions, currentMonth, prevMonth, financeState.categoryOverrides),
    [transactions, currentMonth, prevMonth, financeState.categoryOverrides]
  );
  const insights = useMemo(
    () =>
      generateInsights(
        transactions,
        currentMonth,
        prevMonth,
        financeState.budgets,
        financeState.recurringExpenses,
        financeState.categoryOverrides
      ),
    [transactions, currentMonth, prevMonth, financeState]
  );
  const monthTxs = useMemo(
    () => getMonthTransactions(transactions, currentMonth),
    [transactions, currentMonth]
  );

  // ── Tab Navigation with auto-scroll ────────────────────────────────────────
  const handleSelectTab = (tabId: TabId, index: number) => {
    setActiveTab(tabId);
    tabScrollRef.current?.scrollTo({ x: Math.max(0, index * 88 - 30), animated: true });
  };

  // ── Category Override Handler ─────────────────────────────────────────────
  const handleOverrideCategory = (catId: FinanceCategoryId) => {
    if (!overrideTx) return;
    const existing = financeState.categoryOverrides.filter((o) => o.transactionId !== overrideTx.id);
    onUpdateFinanceState({
      ...financeState,
      categoryOverrides: [...existing, { transactionId: overrideTx.id, categoryId: catId }],
    });
    setOverrideTx(null);
  };

  // ── Budget CRUD Handlers ──────────────────────────────────────────────────
  const handleOpenAddBudget = () => {
    setEditingBudget(null);
    setBudgetCat(null);
    setBudgetLimit('');
    setShowBudgetForm(true);
  };

  const handleOpenEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setBudgetCat(budget.categoryId);
    setBudgetLimit(formatVNDInput(budget.limit));
    setShowBudgetForm(true);
  };

  const handleSaveBudget = () => {
    if (!budgetCat) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Chưa chọn danh mục',
        message: 'Vui lòng chọn danh mục chi tiêu cho ngân sách.',
      });
      return;
    }
    const limit = parseVNDInput(budgetLimit);
    if (!limit || limit <= 0) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Hạn mức không hợp lệ',
        message: 'Vui lòng nhập hạn mức ngân sách hợp lệ lớn hơn 0.',
      });
      return;
    }

    if (editingBudget) {
      // Editing: check duplicate excluding current budget
      const dup = financeState.budgets.find(
        (b) => b.id !== editingBudget.id && b.categoryId === budgetCat && b.month === currentMonth
      );
      if (dup) {
        setFeedback({
          visible: true,
          variant: 'warning',
          title: 'Trùng lặp ngân sách',
          message: 'Đã có ngân sách cho danh mục này trong tháng.',
        });
        return;
      }
      onUpdateFinanceState({
        ...financeState,
        budgets: financeState.budgets.map((b) =>
          b.id === editingBudget.id ? { ...b, categoryId: budgetCat, limit } : b
        ),
      });
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Cập nhật thành công',
        message: 'Ngân sách danh mục đã được cập nhật.',
      });
    } else {
      // Creating
      const dup = financeState.budgets.find((b) => b.categoryId === budgetCat && b.month === currentMonth);
      if (dup) {
        setFeedback({
          visible: true,
          variant: 'warning',
          title: 'Trùng lặp ngân sách',
          message: 'Đã có ngân sách cho danh mục này trong tháng.',
        });
        return;
      }
      onUpdateFinanceState({
        ...financeState,
        budgets: [
          ...financeState.budgets,
          { id: uid(), categoryId: budgetCat, month: currentMonth, limit, createdAt: new Date().toISOString() },
        ],
      });
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Thiết lập thành công',
        message: 'Ngân sách chi tiêu mới đã được tạo.',
      });
    }

    setShowBudgetForm(false);
    setEditingBudget(null);
    setBudgetCat(null);
    setBudgetLimit('');
  };

  const handleDeleteBudget = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Xoá ngân sách',
      message: 'Bạn có chắc chắn muốn xoá ngân sách chi tiêu này?',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
        onUpdateFinanceState({
          ...financeState,
          budgets: financeState.budgets.filter((b) => b.id !== id),
        });
        setFeedback({
          visible: true,
          variant: 'success',
          title: 'Đã xoá ngân sách',
          message: 'Ngân sách đã được xoá thành công.',
        });
      },
    });
  };

  // ── Goal CRUD Handlers ────────────────────────────────────────────────────
  const handleOpenAddGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTarget('');
    setGoalDate('');
    setGoalColor(GOAL_COLORS[0]);
    setShowGoalForm(true);
  };

  const handleOpenEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTarget(formatVNDInput(goal.targetAmount));
    setGoalDate(goal.targetDate || '');
    setGoalColor(goal.color);
    setShowGoalForm(true);
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Thiếu tên mục tiêu',
        message: 'Vui lòng nhập tên mục tiêu tiết kiệm.',
      });
      return;
    }
    const target = parseVNDInput(goalTarget);
    if (!target || target <= 0) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Số tiền không hợp lệ',
        message: 'Vui lòng nhập số tiền mục tiêu hợp lệ lớn hơn 0.',
      });
      return;
    }

    if (editingGoal) {
      onUpdateFinanceState({
        ...financeState,
        savingsGoals: financeState.savingsGoals.map((g) =>
          g.id === editingGoal.id
            ? {
                ...g,
                title: goalTitle.trim(),
                targetAmount: target,
                targetDate: goalDate.trim() || undefined,
                color: goalColor,
              }
            : g
        ),
      });
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Cập nhật thành công',
        message: 'Mục tiêu tiết kiệm đã được cập nhật.',
      });
    } else {
      onUpdateFinanceState({
        ...financeState,
        savingsGoals: [
          ...financeState.savingsGoals,
          {
            id: uid(),
            title: goalTitle.trim(),
            targetAmount: target,
            currentAmount: 0,
            targetDate: goalDate.trim() || undefined,
            createdAt: new Date().toISOString(),
            color: goalColor,
          },
        ],
      });
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Thiết lập thành công',
        message: 'Mục tiêu tiết kiệm mới đã được tạo.',
      });
    }

    setShowGoalForm(false);
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTarget('');
    setGoalDate('');
    setGoalColor(GOAL_COLORS[0]);
  };

  const handleAddToGoal = () => {
    const amount = parseVNDInput(addGoalAmount);
    if (!amount || amount <= 0) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Số tiền không hợp lệ',
        message: 'Vui lòng nhập số tiền hợp lệ lớn hơn 0 để nạp vào mục tiêu.',
      });
      return;
    }
    onUpdateFinanceState({
      ...financeState,
      savingsGoals: financeState.savingsGoals.map((g) =>
        g.id === addGoalId
          ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) }
          : g
      ),
    });
    setAddGoalId(null);
    setAddGoalAmount('');
    setFeedback({
      visible: true,
      variant: 'success',
      title: 'Đã nạp tiền mục tiêu',
      message: 'Số tiền tích lũy đã được ghi nhận vào mục tiêu của bạn.',
    });
  };

  const handleToggleCompleteGoal = (id: string) => {
    onUpdateFinanceState({
      ...financeState,
      savingsGoals: financeState.savingsGoals.map((g) => {
        if (g.id !== id) return g;
        const isDone = !!g.completedAt;
        return {
          ...g,
          completedAt: isDone ? undefined : new Date().toISOString(),
          currentAmount: isDone ? g.currentAmount : g.targetAmount,
        };
      }),
    });
  };

  const handleDeleteGoal = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Xoá mục tiêu',
      message: 'Bạn có chắc chắn muốn xoá mục tiêu tiết kiệm này?',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
        onUpdateFinanceState({
          ...financeState,
          savingsGoals: financeState.savingsGoals.filter((g) => g.id !== id),
        });
        setFeedback({
          visible: true,
          variant: 'success',
          title: 'Đã xoá mục tiêu',
          message: 'Mục tiêu tiết kiệm đã được xoá thành công.',
        });
      },
    });
  };

  // ── Recurring CRUD Handlers ───────────────────────────────────────────────
  const handleOpenAddRecurring = () => {
    setEditingRecurring(null);
    setRecurTitle('');
    setRecurAmount('');
    setRecurCat(null);
    setRecurRule('monthly');
    setRecurDate('');
    setShowRecurForm(true);
  };

  const handleOpenEditRecurring = (item: RecurringExpense) => {
    setEditingRecurring(item);
    setRecurTitle(item.title);
    setRecurAmount(formatVNDInput(item.amount));
    setRecurCat(item.categoryId);
    setRecurRule(item.recurrenceRule);
    setRecurDate(item.nextDueDate);
    setShowRecurForm(true);
  };

  const handleSaveRecurring = () => {
    if (!recurTitle.trim()) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Thiếu tên khoản chi',
        message: 'Vui lòng nhập tên khoản chi định kỳ.',
      });
      return;
    }
    if (!recurCat) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Chưa chọn danh mục',
        message: 'Vui lòng chọn danh mục cho khoản chi.',
      });
      return;
    }
    const amount = parseVNDInput(recurAmount);
    if (!amount || amount <= 0) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Số tiền không hợp lệ',
        message: 'Vui lòng nhập số tiền chi định kỳ hợp lệ lớn hơn 0.',
      });
      return;
    }
    if (!recurDate.trim()) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Thiếu ngày đến hạn',
        message: 'Vui lòng nhập ngày đến hạn (DD/MM/YYYY).',
      });
      return;
    }

    if (editingRecurring) {
      onUpdateFinanceState({
        ...financeState,
        recurringExpenses: financeState.recurringExpenses.map((r) =>
          r.id === editingRecurring.id
            ? {
                ...r,
                title: recurTitle.trim(),
                amount,
                categoryId: recurCat,
                recurrenceRule: recurRule,
                nextDueDate: recurDate.trim(),
              }
            : r
        ),
      });
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Cập nhật thành công',
        message: 'Khoản chi định kỳ đã được cập nhật.',
      });
    } else {
      onUpdateFinanceState({
        ...financeState,
        recurringExpenses: [
          ...financeState.recurringExpenses,
          {
            id: uid(),
            title: recurTitle.trim(),
            amount,
            categoryId: recurCat,
            recurrenceRule: recurRule,
            nextDueDate: recurDate.trim(),
            paidThisCycle: false,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Thiết lập thành công',
        message: 'Khoản chi định kỳ mới đã được tạo.',
      });
    }

    setShowRecurForm(false);
    setEditingRecurring(null);
    setRecurTitle('');
    setRecurAmount('');
    setRecurCat(null);
    setRecurRule('monthly');
    setRecurDate('');
  };

  const handleTogglePaidRecurring = (id: string) => {
    onUpdateFinanceState({
      ...financeState,
      recurringExpenses: financeState.recurringExpenses.map((r) =>
        r.id === id ? { ...r, paidThisCycle: !r.paidThisCycle } : r
      ),
    });
  };

  const handleDeleteRecurring = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Xoá khoản định kỳ',
      message: 'Bạn có chắc chắn muốn xoá khoản chi định kỳ này?',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
        onUpdateFinanceState({
          ...financeState,
          recurringExpenses: financeState.recurringExpenses.filter((r) => r.id !== id),
        });
        setFeedback({
          visible: true,
          variant: 'success',
          title: 'Đã xoá khoản định kỳ',
          message: 'Khoản chi định kỳ đã được xoá thành công.',
        });
      },
    });
  };

  const isCurrentMonthLatest = currentMonth >= getCurrentMonth();

  // ─────────────────────────────────────────────────────────────────────────
  // Render Main Screen
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Standard Screen Header ── */}
      <ScreenHeader title="Quản lý tài chính" onBack={onClose} backLabel="Đóng" />

      {/* ── Natural Month Selector ── */}
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setCurrentMonth(prevMonthStr(currentMonth))}
          style={styles.monthArrow}
          hitSlop={8}
          accessibilityLabel="Tháng trước"
        >
          <ChevronLeft size={18} color={Palette.secondary} strokeWidth={1.75} />
        </Pressable>
        <View style={styles.monthLabelWrap}>
          <Calendar size={14} color={Palette.secondary} strokeWidth={1.75} />
          <Text style={styles.monthLabel}>{formatMonthDisplay(currentMonth)}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (!isCurrentMonthLatest) setCurrentMonth(nextMonthStr(currentMonth));
          }}
          style={[styles.monthArrow, isCurrentMonthLatest && { opacity: 0.3 }]}
          hitSlop={8}
          disabled={isCurrentMonthLatest}
          accessibilityLabel="Tháng sau"
        >
          <ChevronRight size={18} color={Palette.secondary} strokeWidth={1.75} />
        </Pressable>
      </View>

      {/* ── Polished Auto-scrolling Horizontal Tab Bar ── */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((t, idx) => {
            const isActive = activeTab === t.id;
            return (
              <Pressable
                key={t.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleSelectTab(t.id, idx)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t.label}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={[
          styles.contentScrollContainer,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'overview' && (
          <OverviewSection
            summary={summary}
            breakdown={breakdown}
            weeklyTrend={weeklyTrend}
            comparison={comparison}
            budgets={financeState.budgets.filter((b) => b.month === currentMonth)}
            transactions={transactions}
            monthTxs={monthTxs}
            overrides={financeState.categoryOverrides}
            onEditCategory={setOverrideTx}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetSection
            budgets={financeState.budgets.filter((b) => b.month === currentMonth)}
            transactions={transactions}
            overrides={financeState.categoryOverrides}
            onAdd={handleOpenAddBudget}
            onEdit={handleOpenEditBudget}
            onDelete={handleDeleteBudget}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsSection
            goals={financeState.savingsGoals}
            onAdd={handleOpenAddGoal}
            onEdit={handleOpenEditGoal}
            onAddAmount={(id) => {
              setAddGoalId(id);
              setAddGoalAmount('');
            }}
            onToggleComplete={handleToggleCompleteGoal}
            onDelete={handleDeleteGoal}
          />
        )}
        {activeTab === 'recurring' && (
          <RecurringSection
            items={financeState.recurringExpenses}
            onAdd={handleOpenAddRecurring}
            onEdit={handleOpenEditRecurring}
            onTogglePaid={handleTogglePaidRecurring}
            onDelete={handleDeleteRecurring}
          />
        )}
        {activeTab === 'insights' && <InsightsSection insights={insights} />}
      </ScrollView>

      {/* ── Category Override Modal ── */}
      <CategoryPickerModal
        visible={!!overrideTx}
        current={overrideTx ? classifyTransaction(overrideTx, financeState.categoryOverrides) : undefined}
        onSelect={handleOverrideCategory}
        onClose={() => setOverrideTx(null)}
      />

      {/* ── Category Picker for Budget ── */}
      <CategoryPickerModal
        visible={showBudgetCatPicker}
        expenseOnly
        current={budgetCat ?? undefined}
        onSelect={(id) => setBudgetCat(id)}
        onClose={() => setShowBudgetCatPicker(false)}
      />

      {/* ── Category Picker for Recurring ── */}
      <CategoryPickerModal
        visible={showRecurCatPicker}
        expenseOnly
        current={recurCat ?? undefined}
        onSelect={(id) => setRecurCat(id)}
        onClose={() => setShowRecurCatPicker(false)}
      />

      {/* ── Add / Edit Budget Bottom-Sheet Modal ── */}
      <Modal
        visible={showBudgetForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBudgetForm(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowBudgetForm(false)} />
          <View style={[styles.bottomSheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.sheetSolidCard}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingBudget ? 'Chỉnh sửa ngân sách' : 'Thêm ngân sách'}
                </Text>
                <Pressable onPress={() => setShowBudgetForm(false)} hitSlop={8} style={styles.sheetCloseBtn}>
                  <X size={18} color={Palette.secondary} strokeWidth={1.75} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 420 }}
              >
                <Text style={styles.formFieldLabel}>Danh mục chi tiêu</Text>
                <Pressable
                  style={styles.formSelectBox}
                  onPress={() => setShowBudgetCatPicker(true)}
                >
                  <Text style={[styles.formSelectValue, !budgetCat && { color: Palette.secondary }]}>
                    {budgetCat ? getCategoryById(budgetCat).label : 'Chọn danh mục…'}
                  </Text>
                </Pressable>

                <Text style={styles.formFieldLabel}>Hạn mức tháng (VNĐ)</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={budgetLimit}
                  onChangeText={(text) => setBudgetLimit(formatVNDInput(text))}
                  placeholder="Nhập số tiền"
                  placeholderTextColor={Palette.secondary}
                  keyboardType="numeric"
                  returnKeyType="done"
                />

                <Pressable style={styles.formSubmitBtn} onPress={handleSaveBudget}>
                  <Text style={styles.formSubmitBtnText}>
                    {editingBudget ? 'Lưu thay đổi' : 'Tạo ngân sách'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit Goal Bottom-Sheet Modal ── */}
      <Modal
        visible={showGoalForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalForm(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowGoalForm(false)} />
          <View style={[styles.bottomSheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.sheetSolidCard}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingGoal ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu tiết kiệm'}
                </Text>
                <Pressable onPress={() => setShowGoalForm(false)} hitSlop={8} style={styles.sheetCloseBtn}>
                  <X size={18} color={Palette.secondary} strokeWidth={1.75} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 440 }}
              >
                <Text style={styles.formFieldLabel}>Tên mục tiêu</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  placeholder="Nhập tên mục tiêu"
                  placeholderTextColor={Palette.secondary}
                  returnKeyType="next"
                />

                <Text style={styles.formFieldLabel}>Số tiền mục tiêu (VNĐ)</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={goalTarget}
                  onChangeText={(text) => setGoalTarget(formatVNDInput(text))}
                  placeholder="Nhập số tiền"
                  placeholderTextColor={Palette.secondary}
                  keyboardType="numeric"
                  returnKeyType="next"
                />

                <Text style={styles.formFieldLabel}>Hạn hoàn thành (tùy chọn, DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={goalDate}
                  onChangeText={setGoalDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={Palette.secondary}
                  returnKeyType="done"
                />

                <Text style={styles.formFieldLabel}>Nhận diện màu sắc</Text>
                <View style={styles.colorPaletteRow}>
                  {GOAL_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        goalColor === c && styles.colorCircleActive,
                      ]}
                      onPress={() => setGoalColor(c)}
                    />
                  ))}
                </View>

                <Pressable style={styles.formSubmitBtn} onPress={handleSaveGoal}>
                  <Text style={styles.formSubmitBtnText}>
                    {editingGoal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Amount to Goal Modal ── */}
      <Modal
        visible={!!addGoalId}
        transparent
        animationType="fade"
        onRequestClose={() => setAddGoalId(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddGoalId(null)} />
          <View style={[styles.bottomSheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.sheetSolidCard}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Cập nhật tiến độ</Text>
                <Pressable onPress={() => setAddGoalId(null)} hitSlop={8} style={styles.sheetCloseBtn}>
                  <X size={18} color={Palette.secondary} strokeWidth={1.75} />
                </Pressable>
              </View>

              <Text style={styles.formFieldLabel}>Thêm số tiền đã tích luỹ (VNĐ)</Text>
              <TextInput
                style={styles.formTextInput}
                value={addGoalAmount}
                onChangeText={(text) => setAddGoalAmount(formatVNDInput(text))}
                placeholder="Nhập số tiền"
                placeholderTextColor={Palette.secondary}
                keyboardType="numeric"
                returnKeyType="done"
                autoFocus
              />

              <Pressable style={styles.formSubmitBtn} onPress={handleAddToGoal}>
                <Text style={styles.formSubmitBtnText}>Xác nhận cộng dồn</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit Recurring Expense Modal ── */}
      <Modal
        visible={showRecurForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecurForm(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRecurForm(false)} />
          <View style={[styles.bottomSheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.sheetSolidCard}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingRecurring ? 'Chỉnh sửa khoản định kỳ' : 'Thêm khoản định kỳ'}
                </Text>
                <Pressable onPress={() => setShowRecurForm(false)} hitSlop={8} style={styles.sheetCloseBtn}>
                  <X size={18} color={Palette.secondary} strokeWidth={1.75} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 440 }}
              >
                <Text style={styles.formFieldLabel}>Tên khoản chi</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={recurTitle}
                  onChangeText={setRecurTitle}
                  placeholder="Nhập tên khoản chi"
                  placeholderTextColor={Palette.secondary}
                />

                <Text style={styles.formFieldLabel}>Danh mục</Text>
                <Pressable
                  style={styles.formSelectBox}
                  onPress={() => setShowRecurCatPicker(true)}
                >
                  <Text style={[styles.formSelectValue, !recurCat && { color: Palette.secondary }]}>
                    {recurCat ? getCategoryById(recurCat).label : 'Chọn danh mục…'}
                  </Text>
                </Pressable>

                <Text style={styles.formFieldLabel}>Số tiền (VNĐ)</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={recurAmount}
                  onChangeText={(text) => setRecurAmount(formatVNDInput(text))}
                  placeholder="Nhập số tiền"
                  placeholderTextColor={Palette.secondary}
                  keyboardType="numeric"
                />

                <Text style={styles.formFieldLabel}>Chu kỳ lặp</Text>
                <View style={styles.recurRuleRow}>
                  {(['monthly', 'weekly', 'yearly'] as const).map((r) => {
                    const isSelected = recurRule === r;
                    const ruleText = r === 'monthly' ? 'Hàng tháng' : r === 'weekly' ? 'Hàng tuần' : 'Hàng năm';
                    return (
                      <Pressable
                        key={r}
                        style={[styles.recurRuleChip, isSelected && styles.recurRuleChipActive]}
                        onPress={() => setRecurRule(r)}
                      >
                        <Text style={[styles.recurRuleChipText, isSelected && styles.recurRuleChipTextActive]}>
                          {ruleText}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.formFieldLabel}>Ngày đến hạn tiếp theo (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={recurDate}
                  onChangeText={setRecurDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={Palette.secondary}
                />

                <Pressable style={styles.formSubmitBtn} onPress={handleSaveRecurring}>
                  <Text style={styles.formSubmitBtnText}>
                    {editingRecurring ? 'Lưu thay đổi' : 'Tạo khoản định kỳ'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Standardized Confirmation Bottom Sheet ── */}
      <ConfirmationBottomSheet
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Xoá"
        cancelLabel="Huỷ bỏ"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, visible: false }))}
      />

      {/* ── Standardized Feedback Dialog ── */}
      <FeedbackDialog
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Overview & Reports
// ─────────────────────────────────────────────────────────────────────────────

function OverviewSection({
  summary,
  breakdown,
  weeklyTrend,
  comparison,
  budgets,
  transactions,
  monthTxs,
  overrides,
  onEditCategory,
}: {
  summary: ReturnType<typeof calcMonthlySummary>;
  breakdown: ReturnType<typeof calcCategoryBreakdown>;
  weeklyTrend: ReturnType<typeof calcWeeklyTrend>;
  comparison: ReturnType<typeof calcMonthComparison>;
  budgets: Budget[];
  transactions: Transaction[];
  monthTxs: Transaction[];
  overrides: CategoryOverride[];
  onEditCategory: (tx: Transaction) => void;
}) {
  const totalExpense = breakdown.reduce((s, c) => s + c.total, 0);

  // Budget performance stats
  const budgetStats = useMemo(() => {
    if (budgets.length === 0) return null;
    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    for (const b of budgets) {
      totalBudget += b.limit;
      const { spent, percent } = calcBudgetProgress(b, transactions, overrides);
      totalSpent += spent;
      if (percent >= 1) exceededCount++;
    }
    return { totalBudget, totalSpent, exceededCount, totalBudgets: budgets.length };
  }, [budgets, transactions, overrides]);

  return (
    <>
      {/* ── Summary Cards ── */}
      <View style={styles.summaryRow}>
        <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ArrowDownLeft size={14} color={Palette.incomeGreen} strokeWidth={2} />
            <Text style={styles.summaryLabel}>Thu nhập</Text>
          </View>
          <Text style={styles.summaryValue}>{formatVND(summary.totalIncome)}</Text>
        </GlassView>

        <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ArrowUpRight size={14} color={Palette.expenseRed} strokeWidth={2} />
            <Text style={styles.summaryLabel}>Chi tiêu</Text>
          </View>
          <Text style={styles.summaryValue}>{formatVND(summary.totalExpense)}</Text>
        </GlassView>

        <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <TrendingUp
              size={14}
              color={summary.netFlow >= 0 ? Palette.incomeGreen : Palette.expenseRed}
              strokeWidth={2}
            />
            <Text style={styles.summaryLabel}>Dòng tiền</Text>
          </View>
          <Text
            style={[
              styles.summaryValue,
              { color: summary.netFlow >= 0 ? Palette.incomeGreen : Palette.expenseRed },
            ]}
          >
            {summary.netFlow >= 0 ? '+' : ''}
            {formatVND(summary.netFlow)}
          </Text>
        </GlassView>
      </View>

      {/* ── Month-over-Month Comparison Card ── */}
      {(comparison.incomeDiffPct !== null || comparison.expenseDiffPct !== null) && (
        <GlassView variant="card" borderRadius={Radius.lg} style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Calendar size={15} color={Palette.secondary} strokeWidth={1.75} />
            <Text style={styles.sectionCardTitle}>So với tháng trước</Text>
          </View>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Thu nhập</Text>
              <Text
                style={[
                  styles.comparisonValue,
                  comparison.incomeDiffPct !== null && comparison.incomeDiffPct >= 0
                    ? { color: Palette.incomeGreen }
                    : { color: Palette.expenseRed },
                ]}
              >
                {comparison.incomeDiffPct !== null
                  ? `${comparison.incomeDiffPct >= 0 ? '+' : ''}${comparison.incomeDiffPct}%`
                  : '—'}
              </Text>
            </View>
            <View style={styles.comparisonDivider} />
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Chi tiêu</Text>
              <Text
                style={[
                  styles.comparisonValue,
                  comparison.expenseDiffPct !== null && comparison.expenseDiffPct > 0
                    ? { color: Palette.expenseRed }
                    : { color: Palette.incomeGreen },
                ]}
              >
                {comparison.expenseDiffPct !== null
                  ? `${comparison.expenseDiffPct >= 0 ? '+' : ''}${comparison.expenseDiffPct}%`
                  : '—'}
              </Text>
            </View>
          </View>
        </GlassView>
      )}

      {/* ── Budget Performance Card ── */}
      {budgetStats && (
        <GlassView variant="card" borderRadius={Radius.lg} style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <PieChart size={15} color={Palette.secondary} strokeWidth={1.75} />
            <Text style={styles.sectionCardTitle}>Hiệu suất ngân sách tháng</Text>
          </View>
          <View style={styles.budgetStatsRow}>
            <Text style={styles.budgetStatsText}>
              Đã dùng {formatVND(budgetStats.totalSpent)} / {formatVND(budgetStats.totalBudget)}
            </Text>
            <Text
              style={[
                styles.budgetStatsBadge,
                budgetStats.exceededCount > 0 ? { color: Palette.expenseRed } : { color: Palette.incomeGreen },
              ]}
            >
              {budgetStats.exceededCount > 0
                ? `${budgetStats.exceededCount} mục vượt mức`
                : 'Trong tầm kiểm soát'}
            </Text>
          </View>
          <ProgressBar
            percent={budgetStats.totalBudget > 0 ? budgetStats.totalSpent / budgetStats.totalBudget : 0}
            color={budgetStats.exceededCount > 0 ? Palette.expenseRed : Palette.primary}
          />
        </GlassView>
      )}

      {/* ── Weekly Trend ── */}
      <GlassView variant="card" borderRadius={Radius.lg} style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <BarChart2 size={15} color={Palette.secondary} strokeWidth={1.75} />
          <Text style={styles.sectionCardTitle}>Chi tiêu theo tuần</Text>
        </View>
        <View style={styles.chartAlignBox}>
          <MiniBarChart
            data={weeklyTrend.map((w) => ({ label: w.weekLabel, amount: w.amount }))}
            color={Palette.primary}
          />
        </View>
      </GlassView>

      {/* ── Category Breakdown ── */}
      {breakdown.length > 0 && (
        <GlassView variant="card" borderRadius={Radius.lg} style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <PieChart size={15} color={Palette.secondary} strokeWidth={1.75} />
            <Text style={styles.sectionCardTitle}>Phân bổ theo danh mục</Text>
          </View>
          {breakdown.map((item) => {
            const cat = getCategoryById(item.categoryId);
            const CatIcon = cat.Icon;
            const pct = totalExpense > 0 ? item.total / totalExpense : 0;
            return (
              <View key={item.categoryId} style={styles.breakdownRow}>
                <View style={styles.breakdownIconWrap}>
                  <CatIcon size={14} color={cat.color} strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.breakdownMeta}>
                    <Text style={styles.breakdownLabel}>{cat.label}</Text>
                    <Text style={styles.breakdownAmount}>{formatVND(item.total)}</Text>
                  </View>
                  <ProgressBar percent={pct} color={cat.color} />
                </View>
              </View>
            );
          })}
        </GlassView>
      )}

      {/* ── Monthly Transactions with Override ── */}
      {monthTxs.length > 0 ? (
        <GlassView variant="card" borderRadius={Radius.lg} style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <FileText size={15} color={Palette.secondary} strokeWidth={1.75} />
            <Text style={styles.sectionCardTitle}>Giao dịch trong tháng</Text>
          </View>
          {monthTxs.map((tx) => {
            const catId = classifyTransaction(tx, overrides);
            const cat = getCategoryById(catId);
            const CatIcon = cat.Icon;
            const isExp = isExpenseCategory(catId);
            return (
              <Pressable
                key={tx.id}
                style={styles.txRow}
                onPress={() => onEditCategory(tx)}
                accessibilityRole="button"
                accessibilityLabel={`Sửa danh mục cho ${tx.title}`}
              >
                <View style={styles.txIconWrap}>
                  <CatIcon size={15} color={cat.color} strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <Text style={[styles.txCat, { color: cat.color }]}>{cat.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isExp ? Palette.expenseRed : Palette.incomeGreen },
                    ]}
                  >
                    {isExp ? '-' : '+'}
                    {formatVND(Math.abs(tx.amount))}
                  </Text>
                  <Text style={styles.txActionHint}>Đổi danh mục</Text>
                </View>
              </Pressable>
            );
          })}
        </GlassView>
      ) : (
        <View style={styles.emptyContainer}>
          <FileText size={28} color={Palette.secondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
          <Text style={styles.emptySubtitle}>Không tìm thấy giao dịch nào trong tháng này.</Text>
        </View>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Budgets
// ─────────────────────────────────────────────────────────────────────────────

function BudgetSection({
  budgets,
  transactions,
  overrides,
  onAdd,
  onEdit,
  onDelete,
}: {
  budgets: Budget[];
  transactions: Transaction[];
  overrides: CategoryOverride[];
  onAdd: () => void;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <Pressable style={styles.sectionActionBtn} onPress={onAdd}>
        <Plus size={16} color={Palette.white} strokeWidth={2} />
        <Text style={styles.sectionActionBtnText}>Thêm ngân sách</Text>
      </Pressable>

      {budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <PieChart size={28} color={Palette.secondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Chưa có ngân sách</Text>
          <Text style={styles.emptySubtitle}>
            Thiết lập ngân sách theo danh mục để quản lý chi tiêu hiệu quả.
          </Text>
        </View>
      ) : (
        budgets.map((b) => {
          const { spent, remaining, percent } = calcBudgetProgress(b, transactions, overrides);
          const cat = getCategoryById(b.categoryId);
          const CatIcon = cat.Icon;
          const isOver = percent >= 1;
          const barColor = isOver ? Palette.expenseRed : percent >= 0.8 ? Palette.warning : cat.color;

          return (
            <GlassView key={b.id} variant="card" borderRadius={Radius.lg} style={styles.cardItem}>
              <View style={styles.cardItemHeader}>
                <View style={styles.itemIconWrap}>
                  <CatIcon size={16} color={cat.color} strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardItemTitle}>{cat.label}</Text>
                  <Text style={styles.cardItemSub}>
                    Đã chi {formatVND(spent)} / Hạn mức {formatVND(b.limit)}
                  </Text>
                </View>
                <View style={styles.cardItemActions}>
                  <Pressable
                    onPress={() => onEdit(b)}
                    hitSlop={8}
                    style={styles.cardItemIconBtn}
                    accessibilityLabel="Sửa ngân sách"
                  >
                    <Edit2 size={15} color={Palette.secondary} strokeWidth={1.75} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(b.id)}
                    hitSlop={8}
                    style={styles.cardItemIconBtn}
                    accessibilityLabel="Xóa ngân sách"
                  >
                    <Trash2 size={15} color={Palette.secondary} strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>

              <ProgressBar percent={percent} color={barColor} />

              <View style={styles.cardItemFooter}>
                <Text style={[styles.budgetPctText, { color: barColor }]}>
                  {Math.round(percent * 100)}%
                </Text>
                <Text style={styles.budgetRemainingText}>
                  {isOver ? 'Đã vượt hạn mức' : `Còn lại ${formatVND(remaining)}`}
                </Text>
              </View>
            </GlassView>
          );
        })
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Savings Goals
// ─────────────────────────────────────────────────────────────────────────────

function GoalsSection({
  goals,
  onAdd,
  onEdit,
  onAddAmount,
  onToggleComplete,
  onDelete,
}: {
  goals: SavingsGoal[];
  onAdd: () => void;
  onEdit: (goal: SavingsGoal) => void;
  onAddAmount: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <Pressable style={styles.sectionActionBtn} onPress={onAdd}>
        <Plus size={16} color={Palette.white} strokeWidth={2} />
        <Text style={styles.sectionActionBtnText}>Thêm mục tiêu</Text>
      </Pressable>

      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Target size={28} color={Palette.secondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Chưa có mục tiêu</Text>
          <Text style={styles.emptySubtitle}>
            Tạo kế hoạch tích luỹ tài chính và theo dõi hành trình của bạn.
          </Text>
        </View>
      ) : (
        goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min(1, g.currentAmount / g.targetAmount) : 0;
          const isDone = !!g.completedAt;

          return (
            <GlassView key={g.id} variant="card" borderRadius={Radius.lg} style={styles.cardItem}>
              <View style={styles.cardItemHeader}>
                <View style={[styles.itemPillBar, { backgroundColor: g.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardItemTitle}>{g.title}</Text>
                  {g.targetDate && <Text style={styles.cardItemSub}>Hạn: {g.targetDate}</Text>}
                </View>
                {isDone && (
                  <View style={styles.doneBadge}>
                    <CheckCircle2 size={14} color={Palette.incomeGreen} strokeWidth={2} />
                    <Text style={styles.doneBadgeText}>Hoàn thành</Text>
                  </View>
                )}
                <View style={styles.cardItemActions}>
                  <Pressable
                    onPress={() => onEdit(g)}
                    hitSlop={8}
                    style={styles.cardItemIconBtn}
                    accessibilityLabel="Sửa mục tiêu"
                  >
                    <Edit2 size={15} color={Palette.secondary} strokeWidth={1.75} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(g.id)}
                    hitSlop={8}
                    style={styles.cardItemIconBtn}
                    accessibilityLabel="Xóa mục tiêu"
                  >
                    <Trash2 size={15} color={Palette.secondary} strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.goalValuesRow}>
                <Text style={styles.goalCurrentValue}>{formatVNDFull(g.currentAmount)}</Text>
                <Text style={styles.goalTargetValue}>/ {formatVNDFull(g.targetAmount)}</Text>
              </View>

              <ProgressBar percent={pct} color={g.color} />

              <View style={styles.cardItemFooter}>
                <Text style={[styles.budgetPctText, { color: g.color }]}>
                  {Math.round(pct * 100)}%
                </Text>
              </View>

              <View style={styles.goalButtonRow}>
                <Pressable style={styles.goalActionChip} onPress={() => onAddAmount(g.id)}>
                  <Plus size={13} color={Palette.light} strokeWidth={2} />
                  <Text style={styles.goalActionChipText}>Thêm tiền</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.goalActionChip,
                    isDone && { backgroundColor: 'rgba(50,215,75,0.12)' },
                  ]}
                  onPress={() => onToggleComplete(g.id)}
                >
                  <Check
                    size={13}
                    color={isDone ? Palette.incomeGreen : Palette.secondary}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.goalActionChipText,
                      isDone && { color: Palette.incomeGreen },
                    ]}
                  >
                    {isDone ? 'Mở lại' : 'Đã đạt'}
                  </Text>
                </Pressable>
              </View>
            </GlassView>
          );
        })
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4: Recurring Expenses
// ─────────────────────────────────────────────────────────────────────────────

function RecurringSection({
  items,
  onAdd,
  onEdit,
  onTogglePaid,
  onDelete,
}: {
  items: RecurringExpense[];
  onAdd: () => void;
  onEdit: (item: RecurringExpense) => void;
  onTogglePaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const ruleLabel = (r: RecurringExpense['recurrenceRule']) =>
    r === 'monthly' ? 'Hàng tháng' : r === 'weekly' ? 'Hàng tuần' : 'Hàng năm';

  return (
    <>
      <Pressable style={styles.sectionActionBtn} onPress={onAdd}>
        <Plus size={16} color={Palette.white} strokeWidth={2} />
        <Text style={styles.sectionActionBtnText}>Thêm khoản định kỳ</Text>
      </Pressable>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Repeat size={28} color={Palette.secondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Chưa có khoản định kỳ</Text>
          <Text style={styles.emptySubtitle}>Theo dõi các khoản thanh toán thường xuyên của bạn.</Text>
        </View>
      ) : (
        items.map((r) => {
          const cat = getCategoryById(r.categoryId);
          const CatIcon = cat.Icon;

          return (
            <GlassView
              key={r.id}
              variant="card"
              borderRadius={Radius.lg}
              style={[styles.cardItem, r.paidThisCycle && { opacity: 0.6 }]}
            >
              <View style={styles.cardItemHeader}>
                <View style={styles.itemIconWrap}>
                  <CatIcon size={16} color={cat.color} strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardItemTitle}>{r.title}</Text>
                  <Text style={styles.cardItemSub}>
                    {ruleLabel(r.recurrenceRule)} · Hạn: {r.nextDueDate}
                  </Text>
                </View>
                <Text style={styles.recurAmountText}>{formatVND(r.amount)}</Text>
                <View style={styles.cardItemActions}>
                  <Pressable
                    onPress={() => onEdit(r)}
                    hitSlop={8}
                    style={styles.cardItemIconBtn}
                    accessibilityLabel="Sửa khoản định kỳ"
                  >
                    <Edit2 size={15} color={Palette.secondary} strokeWidth={1.75} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(r.id)}
                    hitSlop={8}
                    style={styles.cardItemIconBtn}
                    accessibilityLabel="Xóa khoản định kỳ"
                  >
                    <Trash2 size={15} color={Palette.secondary} strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.paidToggleBtn, r.paidThisCycle && styles.paidToggleBtnActive]}
                onPress={() => onTogglePaid(r.id)}
              >
                <Check
                  size={13}
                  color={r.paidThisCycle ? Palette.incomeGreen : Palette.secondary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.paidToggleBtnText,
                    r.paidThisCycle && { color: Palette.incomeGreen },
                  ]}
                >
                  {r.paidThisCycle ? 'Đã thanh toán chu kỳ này' : 'Đánh dấu đã thanh toán'}
                </Text>
              </Pressable>
            </GlassView>
          );
        })
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 5: Insights
// ─────────────────────────────────────────────────────────────────────────────

function InsightsSection({ insights }: { insights: ReturnType<typeof generateInsights> }) {
  if (insights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Lightbulb size={28} color={Palette.secondary} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Chưa có gợi ý</Text>
        <Text style={styles.emptySubtitle}>
          Gợi ý tài chính sẽ xuất hiện khi có thêm dữ liệu giao dịch và ngân sách.
        </Text>
      </View>
    );
  }

  const renderInsightIcon = (type: 'positive' | 'warning' | 'info') => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 size={16} color={Palette.incomeGreen} strokeWidth={1.75} />;
      case 'warning':
        return <AlertCircle size={16} color={Palette.warning} strokeWidth={1.75} />;
      case 'info':
      default:
        return <Info size={16} color={Palette.secondary} strokeWidth={1.75} />;
    }
  };

  return (
    <>
      <View style={styles.insightNoticeHeader}>
        <Lightbulb size={14} color={Palette.secondary} strokeWidth={1.75} />
        <Text style={styles.insightNoticeHeaderText}>
          Phân tích tự động dựa trên giao dịch thực tế
        </Text>
      </View>

      {insights.map((ins) => (
        <GlassView key={ins.id} variant="card" borderRadius={Radius.lg} style={styles.insightCard}>
          <View style={styles.insightCardHeader}>
            {renderInsightIcon(ins.type)}
            <Text style={styles.insightCardTitle}>{ins.title}</Text>
          </View>
          <Text style={styles.insightCardBody}>{ins.body}</Text>
        </GlassView>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  // Month selector
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Palette.bg,
  },
  monthArrow: {
    padding: Spacing.xs,
  },
  monthLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 140,
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  // Tab bar
  tabBarContainer: {
    backgroundColor: Palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: Spacing.xs,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    borderColor: 'rgba(193, 160, 172, 0.3)',
  },
  tabLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Content scroll
  contentScrollView: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  contentScrollContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  // Section Cards
  sectionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionCardTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  chartAlignBox: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  // Comparison
  comparisonGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  comparisonCol: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  comparisonLabel: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Budget stats summary
  budgetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  budgetStatsText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  budgetStatsBadge: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
  },
  // Breakdown
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  breakdownIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.white,
  },
  breakdownAmount: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  // Progress
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Transactions
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.white,
  },
  txCat: {
    fontSize: Typography.fontSize.caption2,
    marginTop: 2,
  },
  txAmount: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
  },
  txActionHint: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    opacity: 0.7,
    marginTop: 2,
  },
  // Section action button
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  sectionActionBtnText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  // Card items (Budget, Goal, Recurring)
  cardItem: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPillBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  cardItemTitle: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  cardItemSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: 2,
  },
  cardItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardItemIconBtn: {
    padding: Spacing.xs,
  },
  cardItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  budgetPctText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
  },
  budgetRemainingText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  // Goals specifics
  goalValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  goalCurrentValue: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  goalTargetValue: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginRight: Spacing.xs,
  },
  doneBadgeText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.incomeGreen,
    fontWeight: Typography.fontWeight.medium,
  },
  goalButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  goalActionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  goalActionChipText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  // Recurring specifics
  recurAmountText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.expenseRed,
    marginRight: Spacing.xs,
  },
  paidToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  paidToggleBtnActive: {
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
  },
  paidToggleBtnText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  // Insights specifics
  insightNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  insightNoticeHeaderText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
  },
  insightCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  insightCardTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  insightCardBody: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    lineHeight: 18,
  },
  // Empty states
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  // Modal & Bottom Sheet
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  bottomSheetContainer: {
    paddingHorizontal: Spacing.md,
  },
  sheetSolidCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.22)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Forms
  formFieldLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  formTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.callout,
    color: Palette.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.xs,
  },
  formSelectBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.xs,
  },
  formSelectValue: {
    fontSize: Typography.fontSize.callout,
    color: Palette.white,
  },
  formSubmitBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  formSubmitBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  // Color palette picker
  colorPaletteRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: Palette.white,
  },
  // Recurrence rule selector
  recurRuleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  recurRuleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recurRuleChipActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderColor: Palette.primary,
  },
  recurRuleChipText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  recurRuleChipTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.medium,
  },
  // Category Picker Rows
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  pickerRowActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: {
    fontSize: Typography.fontSize.callout,
    color: Palette.white,
  },
});
