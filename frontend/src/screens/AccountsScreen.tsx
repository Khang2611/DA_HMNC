/**
 * AccountsScreen — Tài khoản
 *
 * Displays payment/checking accounts from shared state.
 * Reads directly from props — no independent balance state.
 * Balance changes from Transfer, Top-Up, Savings, QR are reflected
 * immediately because App.tsx passes its single `accounts` array here.
 *
 * Sub-views (AccountDetailView) are rendered inline rather than as
 * separate modals to keep the navigation stack flat and avoid a
 * second SafeArea provider.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  ArrowLeftRight,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Banknote,
  Info,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { Account, Transaction } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { ScreenHeader } from '../components/ScreenHeader';
import { TransactionItem } from '../components/TransactionItem';
import { formatVND, maskAccountNumber } from '../utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountsScreenProps {
  /** Shared account state from App.tsx — single source of truth */
  accounts: Account[];
  /** Shared transaction history from App.tsx */
  transactions: Transaction[];
  onClose: () => void;
  onOpenTransfer: () => void;
  onOpenReceiveQR: () => void;
  onOpenHistory: (accountId?: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function accountTypeLabel(type: Account['type']): string {
  switch (type) {
    case 'checking': return 'Tài khoản thanh toán';
    case 'savings':  return 'Tài khoản tiết kiệm';
    case 'credit':   return 'Thẻ tín dụng';
    default:         return 'Tài khoản';
  }
}

function accountStatusLabel(account: Account): string {
  // All mock accounts are active; credit accounts in debt are still active
  return 'Đang hoạt động';
}

function statusColor(account: Account): string {
  return Palette.incomeGreen;
}

/** Only payment (checking) accounts are shown in the overview total */
function isPaymentAccount(account: Account): boolean {
  return account.type === 'checking';
}

/** Mask middle digits: "9988 7766 5544" → "9988 •••• 5544" */
function maskedDisplay(accountNumber: string): string {
  return maskAccountNumber(accountNumber);
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Detail sub-view
// ─────────────────────────────────────────────────────────────────────────────

interface AccountDetailViewProps {
  account: Account;
  transactions: Transaction[];
  onBack: () => void;
  onOpenTransfer: () => void;
  onOpenReceiveQR: () => void;
  onOpenHistory: () => void;
}

const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  account,
  transactions,
  onBack,
  onOpenTransfer,
  onOpenReceiveQR,
  onOpenHistory,
}) => {
  const insets = useSafeAreaInsets();

  const [balanceVisible, setBalanceVisible] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'none' | 'number' | 'name'>('none');

  // Up to 5 most-recent transactions — no account-level filter since the mock
  // data has no accountId field on Transaction; we show the global recent list
  const recentTx = transactions.slice(0, 5);

  const copyToClipboard = useCallback(async (text: string, kind: 'number' | 'name') => {
    try {
      await Clipboard.setStringAsync(text);
    } catch {
      // expo-clipboard may not be available in Expo Go without bare; fall back
      await Share.share({ message: text });
    }
    setCopyFeedback(kind);
    setTimeout(() => setCopyFeedback('none'), 2000);
  }, []);

  const cleanAccountNumber = account.accountNumber.replace(/\s+/g, '');

  return (
    <View style={[detailStyles.root, { backgroundColor: Palette.bg }]}>
      {/* ── Standard Screen Header ── */}
      <ScreenHeader title="Chi tiết tài khoản" onBack={onBack} />

      <ScrollView
        style={detailStyles.scroll}
        contentContainerStyle={[
          detailStyles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Balance hero card ── */}
        <GlassView
          variant="card"
          borderRadius={Radius.xl}
          luminousBorder
          style={detailStyles.heroCard}
        >
          <View style={detailStyles.heroTint} pointerEvents="none" />
          <Text style={detailStyles.heroLabel}>Số dư khả dụng</Text>
          <View style={detailStyles.heroAmountRow}>
            {balanceVisible ? (
              <Text style={detailStyles.heroAmount} numberOfLines={1}>
                {formatVND(account.balance)}
              </Text>
            ) : (
              <Text style={detailStyles.heroAmountMasked}>••••••• ₫</Text>
            )}
            <Pressable
              onPress={() => setBalanceVisible((v) => !v)}
              hitSlop={10}
              style={detailStyles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={balanceVisible ? 'Ẩn số dư' : 'Hiện số dư'}
            >
              {balanceVisible
                ? <Eye size={20} color={Palette.secondary} strokeWidth={1.75} />
                : <EyeOff size={20} color={Palette.secondary} strokeWidth={1.75} />}
            </Pressable>
          </View>
          <View style={detailStyles.heroStatusRow}>
            <View style={[detailStyles.statusDot, { backgroundColor: statusColor(account) }]} />
            <Text style={detailStyles.heroStatus}>{accountStatusLabel(account)}</Text>
          </View>
        </GlassView>

        {/* ── Quick actions ── */}
        <View style={detailStyles.quickRow}>
          {[
            { label: 'Chuyển tiền', Icon: ArrowLeftRight, onPress: onOpenTransfer },
            { label: 'Nhận tiền',   Icon: QrCode,         onPress: onOpenReceiveQR },
            { label: 'Lịch sử',     Icon: Clock,          onPress: onOpenHistory },
          ].map(({ label, Icon, onPress }) => (
            <Pressable
              key={label}
              onPress={onPress}
              style={({ pressed }) => [detailStyles.quickBtn, pressed && detailStyles.quickBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <GlassView
                variant="subtle"
                borderRadius={Radius.lg}
                style={detailStyles.quickBtnInner}
              >
                <Icon size={20} color={Palette.light} strokeWidth={1.75} />
                <Text style={detailStyles.quickBtnLabel}>{label}</Text>
              </GlassView>
            </Pressable>
          ))}
        </View>

        {/* ── Account identity ── */}
        <View style={detailStyles.section}>
          <Text style={detailStyles.sectionTitle}>Thông tin tài khoản</Text>
          <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={detailStyles.infoCard}>

            {/* Account holder */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <User size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Chủ tài khoản</Text>
                <Text style={detailStyles.infoValue}>Quý Nguyễn</Text>
              </View>
              <Pressable
                onPress={() => copyToClipboard('QUY NGUYEN', 'name')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Sao chép tên chủ tài khoản"
              >
                {copyFeedback === 'name'
                  ? <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={1.75} />
                  : <Copy size={18} color={Palette.secondary} strokeWidth={1.75} />}
              </Pressable>
            </View>

            <View style={detailStyles.divider} />

            {/* Account number */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <Banknote size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Số tài khoản</Text>
                <Text style={detailStyles.infoValue}>{account.accountNumber}</Text>
              </View>
              <Pressable
                onPress={() => copyToClipboard(cleanAccountNumber, 'number')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Sao chép số tài khoản"
              >
                {copyFeedback === 'number'
                  ? <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={1.75} />
                  : <Copy size={18} color={Palette.secondary} strokeWidth={1.75} />}
              </Pressable>
            </View>

            {copyFeedback !== 'none' && (
              <View style={detailStyles.copyFeedback}>
                <CheckCircle2 size={14} color={Palette.incomeGreen} strokeWidth={1.75} />
                <Text style={detailStyles.copyFeedbackText}>
                  {copyFeedback === 'number' ? 'Đã sao chép số tài khoản' : 'Đã sao chép tên chủ tài khoản'}
                </Text>
              </View>
            )}

            <View style={detailStyles.divider} />

            {/* Type */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <Info size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Loại tài khoản</Text>
                <Text style={detailStyles.infoValue}>{accountTypeLabel(account.type)}</Text>
              </View>
            </View>

            <View style={detailStyles.divider} />

            {/* Currency */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <Banknote size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Tiền tệ</Text>
                <Text style={detailStyles.infoValue}>VND — Việt Nam Đồng</Text>
              </View>
            </View>

            <View style={detailStyles.divider} />

            {/* Status */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <CheckCircle2 size={16} color={statusColor(account)} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Trạng thái</Text>
                <Text style={[detailStyles.infoValue, { color: statusColor(account) }]}>
                  {accountStatusLabel(account)}
                </Text>
              </View>
            </View>

            <View style={detailStyles.divider} />

            {/* Account name */}
            <View style={[detailStyles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={detailStyles.infoIconBox}>
                <Info size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Tên tài khoản</Text>
                <Text style={detailStyles.infoValue} numberOfLines={2}>
                  {account.accountName}
                </Text>
              </View>
            </View>
          </GlassView>
        </View>

        {/* ── Recent transactions ── */}
        <View style={detailStyles.section}>
          <View style={detailStyles.sectionHeaderRow}>
            <Text style={detailStyles.sectionTitle}>Giao dịch gần đây</Text>
            <Pressable
              onPress={onOpenHistory}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Xem tất cả giao dịch"
            >
              <Text style={detailStyles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>

          {recentTx.length === 0 ? (
            <GlassView variant="subtle" borderRadius={Radius.lg} style={detailStyles.emptyCard}>
              <XCircle size={36} color={Palette.gray600} strokeWidth={1.5} />
              <Text style={detailStyles.emptyTitle}>Chưa có giao dịch</Text>
              <Text style={detailStyles.emptyDesc}>
                Các giao dịch của tài khoản sẽ xuất hiện tại đây.
              </Text>
            </GlassView>
          ) : (
            <View style={detailStyles.txList}>
              {recentTx.map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  isLast={idx === recentTx.length - 1}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen: Account list
// ─────────────────────────────────────────────────────────────────────────────

export const AccountsScreen: React.FC<AccountsScreenProps> = ({
  accounts,
  transactions,
  onClose,
  onOpenTransfer,
  onOpenReceiveQR,
  onOpenHistory,
}) => {
  const insets = useSafeAreaInsets();

  const [balanceVisible, setBalanceVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Payment accounts are the primary view; we show all account types in the list
  // but only sum checking accounts in the overview total
  const paymentAccounts = accounts.filter(isPaymentAccount);
  const totalBalance = paymentAccounts.reduce((sum, a) => sum + a.balance, 0);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;

  const handleOpenHistoryList = () => {
    onOpenHistory();
  };

  // ── Detail sub-view ───────────────────────────────────────────────────────
  if (selectedAccount) {
    return (
      <AccountDetailView
        account={selectedAccount}
        transactions={transactions}
        onBack={() => setSelectedAccountId(null)}
        onOpenTransfer={() => {
          setSelectedAccountId(null);
          setTimeout(onOpenTransfer, 50);
        }}
        onOpenReceiveQR={() => {
          setSelectedAccountId(null);
          setTimeout(onOpenReceiveQR, 50);
        }}
        onOpenHistory={() => {
          const targetAccountId = selectedAccount.id;
          setSelectedAccountId(null);
          setTimeout(() => onOpenHistory(targetAccountId), 50);
        }}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <View style={[listStyles.root, { backgroundColor: Palette.bg }]}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader title="Tài khoản" onBack={onClose} backLabel="Đóng" />

      <ScrollView
        style={listStyles.scroll}
        contentContainerStyle={[
          listStyles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Total balance overview ── */}
        <GlassView
          variant="card"
          borderRadius={Radius.xl}
          luminousBorder
          style={listStyles.overviewCard}
        >
          <View style={listStyles.overviewTint} pointerEvents="none" />
          <Text style={listStyles.overviewLabel}>Tổng số dư thanh toán</Text>
          <View style={listStyles.overviewAmountRow}>
            {balanceVisible ? (
              <Text style={listStyles.overviewAmount} numberOfLines={1}>
                {formatVND(totalBalance)}
              </Text>
            ) : (
              <Text style={listStyles.overviewAmountMasked}>••••••• ₫</Text>
            )}
            <Pressable
              onPress={() => setBalanceVisible((v) => !v)}
              hitSlop={12}
              style={listStyles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={balanceVisible ? 'Ẩn số dư' : 'Hiện số dư'}
            >
              {balanceVisible
                ? <Eye size={22} color={Palette.secondary} strokeWidth={1.75} />
                : <EyeOff size={22} color={Palette.secondary} strokeWidth={1.75} />}
            </Pressable>
          </View>
          <Text style={listStyles.overviewSub}>
            {paymentAccounts.length} tài khoản thanh toán
          </Text>
        </GlassView>

        {/* ── Quick actions ── */}
        <View style={listStyles.quickRow}>
          {[
            { label: 'Chuyển tiền', Icon: ArrowLeftRight, onPress: onOpenTransfer },
            { label: 'Nhận tiền',   Icon: QrCode,         onPress: onOpenReceiveQR },
            { label: 'Lịch sử',     Icon: Clock,          onPress: handleOpenHistoryList },
          ].map(({ label, Icon, onPress }) => (
            <Pressable
              key={label}
              onPress={onPress}
              style={({ pressed }) => [listStyles.quickBtn, pressed && listStyles.quickBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <GlassView
                variant="subtle"
                borderRadius={Radius.lg}
                style={listStyles.quickBtnInner}
              >
                <Icon size={20} color={Palette.light} strokeWidth={1.75} />
                <Text style={listStyles.quickBtnLabel}>{label}</Text>
              </GlassView>
            </Pressable>
          ))}
        </View>

        {/* ── Account list ── */}
        <View style={listStyles.section}>
          <Text style={listStyles.sectionTitle}>Danh sách tài khoản</Text>

          {accounts.length === 0 ? (
            <GlassView variant="subtle" borderRadius={Radius.lg} style={listStyles.emptyCard}>
              <XCircle size={36} color={Palette.gray600} strokeWidth={1.5} />
              <Text style={listStyles.emptyTitle}>Chưa có tài khoản</Text>
            </GlassView>
          ) : (
            accounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setSelectedAccountId(account.id)}
                style={({ pressed }) => [
                  listStyles.accountCard,
                  pressed && listStyles.accountCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${accountTypeLabel(account.type)}, ${maskedDisplay(account.accountNumber)}`}
              >
                <GlassView
                  variant="card"
                  borderRadius={Radius.lg}
                  luminousBorder
                  style={listStyles.accountCardInner}
                >
                  <View style={listStyles.accountCardTint} pointerEvents="none" />

                  {/* Bank label */}
                  <View style={listStyles.accountCardHeader}>
                    <Text style={listStyles.bankLabel}>MAUVE BANKING</Text>
                    <View style={[listStyles.statusPill, { borderColor: statusColor(account) }]}>
                      <View style={[listStyles.statusDot, { backgroundColor: statusColor(account) }]} />
                      <Text style={[listStyles.statusText, { color: statusColor(account) }]}>
                        {accountStatusLabel(account)}
                      </Text>
                    </View>
                  </View>

                  <Text style={listStyles.accountTypeLine}>
                    {accountTypeLabel(account.type)}
                  </Text>

                  <Text style={listStyles.accountNumberLine}>
                    {maskedDisplay(account.accountNumber)}
                  </Text>

                  <View style={listStyles.accountCardFooter}>
                    {balanceVisible ? (
                      <Text style={listStyles.accountBalance}>
                        {formatVND(account.balance)}
                      </Text>
                    ) : (
                      <Text style={listStyles.accountBalanceMasked}>••••••• ₫</Text>
                    )}
                    <ChevronRight size={18} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                </GlassView>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles helpers
// ─────────────────────────────────────────────────────────────────────────────

const sharedQuick = {
  quickRow: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  quickBtn: { flex: 1 },
  quickBtnPressed: { opacity: 0.75 },
  quickBtnInner: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  quickBtnLabel: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
    textAlign: 'center' as const,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail view styles
// ─────────────────────────────────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.sm },

  // Hero balance card
  heroCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    padding: Spacing.xl,
  },
  heroTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(128,108,121,0.12)',
    borderRadius: Radius.xl,
  },
  heroLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroAmount: {
    flex: 1,
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  heroAmountMasked: {
    flex: 1,
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.gray500,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
  },
  heroStatus: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.incomeGreen,
    fontWeight: Typography.fontWeight.medium,
  },

  // Quick actions
  ...sharedQuick,

  // Info card
  section: {
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.white,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.tight,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(240,217,228,0.07)',
    marginHorizontal: Spacing.lg,
  },
  copyFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  copyFeedbackText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.incomeGreen,
  },

  // Transactions
  txList: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(240,217,228,0.07)',
    backgroundColor: Palette.surfaceL2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyDesc: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray500,
    textAlign: 'center',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// List view styles
// ─────────────────────────────────────────────────────────────────────────────

const listStyles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.sm },

  // Overview card
  overviewCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    padding: Spacing.xl,
  },
  overviewTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(128,108,121,0.12)',
    borderRadius: Radius.xl,
  },
  overviewLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
  },
  overviewAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  overviewAmount: {
    flex: 1,
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  overviewAmountMasked: {
    flex: 1,
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.gray500,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  eyeBtn: { padding: Spacing.xs },
  overviewSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: Spacing.xs,
  },

  // Quick actions
  ...sharedQuick,

  // Account list
  section: {
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  accountCard: {
    marginBottom: Spacing.md,
  },
  accountCardPressed: { opacity: 0.85 },
  accountCardInner: {
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  accountCardTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(128,108,121,0.08)',
    borderRadius: Radius.lg,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bankLabel: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.incomeGreen,
    backgroundColor: 'rgba(50,215,75,0.08)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
  },
  accountTypeLine: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: Spacing.sm,
  },
  accountNumberLine: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.lg,
  },
  accountCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountBalance: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  accountBalanceMasked: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.gray500,
    letterSpacing: Typography.letterSpacing.tighter,
  },
});
