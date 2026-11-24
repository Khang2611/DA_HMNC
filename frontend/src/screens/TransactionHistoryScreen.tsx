/**
 * TransactionHistoryScreen — Lịch sử giao dịch
 *
 * Complete Transaction History module for Mauve Banking.
 * - Single continuous dark background (Palette.bg = '#16131F')
 * - Dynamic financial summary (Tiền vào, Tiền ra)
 * - Search by title, recipient, note, bank, reference code (diacritic-insensitive)
 * - Type filters (Tất cả, Tiền vào, Tiền ra)
 * - Date presets (7 ngày, 30 ngày, 90 ngày, Tùy chọn) + DateRangePickerModal
 * - Account filter chips (Tất cả tài khoản, specific accounts)
 * - SectionList grouped by date with TransactionItem
 * - Inline TransactionDetailView with clipboard copy and receipt sharing
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Layers,
  Copy,
  CheckCircle2,
  Share2,
  Info,
  Clock,
  Banknote,
  User,
  Building2,
  Receipt,
  FileQuestion,
  CreditCard,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { Account, Transaction } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { TransactionItem } from '../components/TransactionItem';
import { DateRangePickerModal } from '../components/DateRangePickerModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatVND, maskAccountNumber } from '../utils/formatters';
import {
  DatePreset,
  TypeFilter,
  calculateTransactionSummary,
  filterTransactions,
  groupTransactionsByDate,
  formatDateDisplay,
  formatDetailDateTime,
  getTransactionTypeLabel,
} from '../utils/transactionHistory';

// ─────────────────────────────────────────────────────────────────────────────
// Screen Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionHistoryScreenProps {
  accounts: Account[];
  transactions: Transaction[];
  initialAccountId?: string;
  initialCardId?: string;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Detail View Component
// ─────────────────────────────────────────────────────────────────────────────

interface TransactionDetailViewProps {
  transaction: Transaction;
  accounts: Account[];
  onBack: () => void;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
  transaction,
  accounts,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  const [copyFeedback, setCopyFeedback] = useState(false);

  const isPositive = transaction.amount > 0;
  const sourceAccount = accounts.find((a) => a.id === transaction.accountId);
  const refCode = transaction.referenceCode || transaction.id;

  const handleCopyCode = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(refCode);
    } catch {
      await Share.share({ message: refCode });
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }, [refCode]);

  const handleShareReceipt = async () => {
    try {
      const typeLabel = getTransactionTypeLabel(transaction.type);
      const formattedTime = formatDetailDateTime(transaction);
      const amountStr = (isPositive ? '+' : '') + formatVND(transaction.amount);

      let details = `MAUVE BANKING — BIÊN LAI GIAO DỊCH\n`;
      details += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      details += `Mã giao dịch: ${refCode}\n`;
      details += `Loại giao dịch: ${typeLabel}\n`;
      details += `Số tiền: ${amountStr}\n`;
      details += `Thời gian: ${formattedTime}\n`;
      details += `Trạng thái: Thành công\n`;
      if (sourceAccount) {
        details += `Tài khoản nguồn: ${maskAccountNumber(sourceAccount.accountNumber)}\n`;
      }
      if (transaction.recipientName) {
        details += `Người thụ hưởng: ${transaction.recipientName}\n`;
      }
      if (transaction.recipientBank) {
        details += `Ngân hàng: ${transaction.recipientBank}\n`;
      }
      if (transaction.recipientAccountNumber) {
        details += `Số tài khoản nhận: ${transaction.recipientAccountNumber}\n`;
      }
      if (transaction.senderName) {
        details += `Người gửi: ${transaction.senderName}\n`;
      }
      if (transaction.note) {
        details += `Nội dung: ${transaction.note}\n`;
      }
      details += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      details += `Mauve Banking — Ngân hàng số tối giản`;

      await Share.share({ message: details });
    } catch {
      // User cancelled share
    }
  };

  return (
    <View style={[detailStyles.root, { backgroundColor: Palette.bg }]}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader title="Chi tiết giao dịch" onBack={onBack} />

      <ScrollView
        style={detailStyles.scroll}
        contentContainerStyle={[
          detailStyles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Amount Card ── */}
        <GlassView
          variant="card"
          borderRadius={Radius.xl}
          luminousBorder
          style={detailStyles.heroCard}
        >
          <View style={detailStyles.heroTint} pointerEvents="none" />

          {/* Type Badge */}
          <View style={detailStyles.typeBadgeRow}>
            <View
              style={[
                detailStyles.typeBadge,
                isPositive ? detailStyles.typeBadgeIn : detailStyles.typeBadgeOut,
              ]}
            >
              {isPositive ? (
                <ArrowDownLeft size={14} color={Palette.incomeGreen} strokeWidth={2.5} />
              ) : (
                <ArrowUpRight size={14} color={Palette.secondary} strokeWidth={2.5} />
              )}
              <Text
                style={[
                  detailStyles.typeBadgeText,
                  { color: isPositive ? Palette.incomeGreen : Palette.secondary },
                ]}
              >
                {isPositive ? 'Tiền vào' : 'Tiền ra'}
              </Text>
            </View>

            <View style={detailStyles.statusBadge}>
              <CheckCircle2 size={13} color={Palette.incomeGreen} strokeWidth={2} />
              <Text style={detailStyles.statusBadgeText}>Thành công</Text>
            </View>
          </View>

          {/* Amount */}
          <Text
            style={[
              detailStyles.heroAmount,
              isPositive ? detailStyles.amountPositive : detailStyles.amountNeutral,
            ]}
            numberOfLines={1}
          >
            {isPositive ? `+${formatVND(transaction.amount)}` : formatVND(transaction.amount)}
          </Text>

          {/* Title */}
          <Text style={detailStyles.heroTitle} numberOfLines={2}>
            {transaction.title}
          </Text>
        </GlassView>

        {/* ── Detail Info Card ── */}
        <View style={detailStyles.section}>
          <Text style={detailStyles.sectionTitle}>Thông tin chi tiết</Text>
          <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={detailStyles.infoCard}>

            {/* Loại giao dịch */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <Receipt size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Loại giao dịch</Text>
                <Text style={detailStyles.infoValue}>
                  {getTransactionTypeLabel(transaction.type)}
                </Text>
              </View>
            </View>

            <View style={detailStyles.divider} />

            {/* Thời gian */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <Clock size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Thời gian giao dịch</Text>
                <Text style={detailStyles.infoValue}>
                  {formatDetailDateTime(transaction)}
                </Text>
              </View>
            </View>

            <View style={detailStyles.divider} />

            {/* Mã giao dịch */}
            <View style={detailStyles.infoRow}>
              <View style={detailStyles.infoIconBox}>
                <Info size={16} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={detailStyles.infoContent}>
                <Text style={detailStyles.infoLabel}>Mã giao dịch</Text>
                <Text style={detailStyles.infoValue}>{refCode}</Text>
              </View>
              <Pressable
                onPress={handleCopyCode}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Sao chép mã giao dịch"
              >
                {copyFeedback ? (
                  <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={1.75} />
                ) : (
                  <Copy size={18} color={Palette.secondary} strokeWidth={1.75} />
                )}
              </Pressable>
            </View>

            {copyFeedback && (
              <View style={detailStyles.copyFeedback}>
                <CheckCircle2 size={14} color={Palette.incomeGreen} strokeWidth={1.75} />
                <Text style={detailStyles.copyFeedbackText}>Đã sao chép mã giao dịch</Text>
              </View>
            )}

            {/* Tài khoản nguồn */}
            {sourceAccount && (
              <>
                <View style={detailStyles.divider} />
                <View style={detailStyles.infoRow}>
                  <View style={detailStyles.infoIconBox}>
                    <Banknote size={16} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                  <View style={detailStyles.infoContent}>
                    <Text style={detailStyles.infoLabel}>Tài khoản nguồn</Text>
                    <Text style={detailStyles.infoValue}>
                      {sourceAccount.accountName} ({maskAccountNumber(sourceAccount.accountNumber)})
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Người nhận / Thụ hưởng */}
            {transaction.recipientName && (
              <>
                <View style={detailStyles.divider} />
                <View style={detailStyles.infoRow}>
                  <View style={detailStyles.infoIconBox}>
                    <User size={16} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                  <View style={detailStyles.infoContent}>
                    <Text style={detailStyles.infoLabel}>Người thụ hưởng</Text>
                    <Text style={detailStyles.infoValue}>{transaction.recipientName}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Ngân hàng nhận */}
            {transaction.recipientBank && (
              <>
                <View style={detailStyles.divider} />
                <View style={detailStyles.infoRow}>
                  <View style={detailStyles.infoIconBox}>
                    <Building2 size={16} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                  <View style={detailStyles.infoContent}>
                    <Text style={detailStyles.infoLabel}>Ngân hàng thụ hưởng</Text>
                    <Text style={detailStyles.infoValue}>{transaction.recipientBank}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Người gửi */}
            {transaction.senderName && (
              <>
                <View style={detailStyles.divider} />
                <View style={detailStyles.infoRow}>
                  <View style={detailStyles.infoIconBox}>
                    <User size={16} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                  <View style={detailStyles.infoContent}>
                    <Text style={detailStyles.infoLabel}>Người gửi</Text>
                    <Text style={detailStyles.infoValue}>{transaction.senderName}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Nội dung giao dịch */}
            {transaction.note && (
              <>
                <View style={detailStyles.divider} />
                <View style={[detailStyles.infoRow, { borderBottomWidth: 0 }]}>
                  <View style={detailStyles.infoIconBox}>
                    <Info size={16} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                  <View style={detailStyles.infoContent}>
                    <Text style={detailStyles.infoLabel}>Nội dung</Text>
                    <Text style={detailStyles.infoValue} numberOfLines={4}>
                      {transaction.note}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </GlassView>
        </View>

        {/* ── Action Buttons ── */}
        <View style={detailStyles.actionsContainer}>
          <Pressable
            onPress={handleShareReceipt}
            style={({ pressed }) => [detailStyles.shareBtn, pressed && detailStyles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Chia sẻ biên lai"
          >
            <GlassView
              variant="card"
              borderRadius={Radius.lg}
              luminousBorder
              style={detailStyles.shareBtnInner}
            >
              <Share2 size={18} color={Palette.white} strokeWidth={1.75} />
              <Text style={detailStyles.shareBtnText}>Chia sẻ biên lai</Text>
            </GlassView>
          </Pressable>

          <Pressable
            onPress={onBack}
            style={({ pressed }) => [detailStyles.secondaryBtn, pressed && detailStyles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Quay lại danh sách"
          >
            <Text style={detailStyles.secondaryBtnText}>Quay lại danh sách</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Transaction History Screen
// ─────────────────────────────────────────────────────────────────────────────

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  accounts,
  transactions,
  initialAccountId = 'all',
  initialCardId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // Filter States
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(initialCardId);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('30_days');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Detail Sub-view State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // 1. Dynamic Financial Summary (strictly respects date range & account & card, unaffected by search/type)
  const summary = useMemo(() => {
    return calculateTransactionSummary(
      transactions,
      selectedAccountId,
      datePreset,
      customStart,
      customEnd,
      selectedCardId
    );
  }, [transactions, selectedAccountId, datePreset, customStart, customEnd, selectedCardId]);

  // 2. Filtered Transactions List
  const filteredList = useMemo(() => {
    return filterTransactions(transactions, {
      accountId: selectedAccountId,
      cardId: selectedCardId,
      datePreset,
      customStart,
      customEnd,
      typeFilter,
      searchQuery,
    });
  }, [transactions, selectedAccountId, selectedCardId, datePreset, customStart, customEnd, typeFilter, searchQuery]);

  // 3. SectionList Grouped Data
  const sections = useMemo(() => {
    return groupTransactionsByDate(filteredList);
  }, [filteredList]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedAccountId('all');
    setSelectedCardId(undefined);
    setTypeFilter('all');
    setDatePreset('30_days');
    setCustomStart(undefined);
    setCustomEnd(undefined);
    setSearchQuery('');
  };

  const handleApplyDateRange = (preset: DatePreset, start?: Date, end?: Date) => {
    setDatePreset(preset);
    if (preset === 'custom') {
      setCustomStart(start);
      setCustomEnd(end);
    } else {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  const datePresetLabel = useMemo(() => {
    switch (datePreset) {
      case '7_days':  return '7 ngày';
      case '30_days': return '30 ngày';
      case '90_days': return '90 ngày';
      case 'custom':
        if (customStart && customEnd) {
          return `${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}`;
        }
        return 'Tùy chọn';
      default:
        return 'Tất cả';
    }
  }, [datePreset, customStart, customEnd]);

  // ── Render Detail View if selected ─────────────────────────────────────────
  if (selectedTransaction) {
    return (
      <TransactionDetailView
        transaction={selectedTransaction}
        accounts={accounts}
        onBack={() => setSelectedTransaction(null)}
      />
    );
  }

  // ── Render Main History Screen ────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: Palette.bg }]}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader
        title="Lịch sử giao dịch"
        onBack={onClose}
        rightElement={
          <Pressable
            onPress={handleResetFilters}
            hitSlop={8}
            style={styles.resetBtn}
            accessibilityRole="button"
            accessibilityLabel="Đặt lại bộ lọc"
          >
            <RotateCcw size={18} color={Palette.secondary} strokeWidth={1.75} />
          </Pressable>
        }
      />

      {/* ── Virtualized SectionList ── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        onScrollBeginDrag={Keyboard.dismiss}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* 1. Dynamic Financial Summary Card */}
            <GlassView
              variant="card"
              borderRadius={Radius.xl}
              luminousBorder
              style={styles.summaryCard}
            >
              <View style={styles.summaryTint} pointerEvents="none" />

              <View style={styles.summaryHeader}>
                <Text style={styles.summaryPeriod}>
                  Tổng kết ({datePresetLabel})
                </Text>
                {selectedAccountId !== 'all' && (
                  <Text style={styles.summaryAccountTag} numberOfLines={1}>
                    {accounts.find((a) => a.id === selectedAccountId)?.accountName}
                  </Text>
                )}
              </View>

              <View style={styles.summaryColumns}>
                {/* Tiền vào */}
                <View style={styles.summaryCol}>
                  <View style={styles.summaryLabelRow}>
                    <View style={[styles.summaryDot, { backgroundColor: Palette.incomeGreen }]} />
                    <Text style={styles.summaryLabel}>Tiền vào</Text>
                  </View>
                  <Text style={[styles.summaryAmount, styles.summaryAmountIn]} numberOfLines={1}>
                    +{formatVND(summary.totalIn)}
                  </Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.summaryDivider} />

                {/* Tiền ra */}
                <View style={styles.summaryCol}>
                  <View style={styles.summaryLabelRow}>
                    <View style={[styles.summaryDot, { backgroundColor: Palette.secondary }]} />
                    <Text style={styles.summaryLabel}>Tiền ra</Text>
                  </View>
                  <Text style={[styles.summaryAmount, styles.summaryAmountOut]} numberOfLines={1}>
                    -{formatVND(summary.totalOut)}
                  </Text>
                </View>
              </View>
            </GlassView>

            {/* 2. Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Search size={18} color={Palette.secondary} strokeWidth={1.75} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Nhập từ khóa tìm kiếm"
                  placeholderTextColor={Palette.gray500}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}
                    style={styles.searchClearBtn}
                  >
                    <X size={16} color={Palette.light} strokeWidth={2} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* 3. Type Filter Segment (Tất cả, Tiền vào, Tiền ra) */}
            <View style={styles.typeSegment}>
              {(['all', 'in', 'out'] as TypeFilter[]).map((tab) => {
                const isActive = typeFilter === tab;
                const label = tab === 'all' ? 'Tất cả' : tab === 'in' ? 'Tiền vào' : 'Tiền ra';
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setTypeFilter(tab)}
                    style={[styles.typeTab, isActive && styles.typeTabActive]}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                  >
                    <Text style={[styles.typeTabText, isActive && styles.typeTabTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 4. Date Presets & Picker Trigger */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datePresetRow}
            >
              {(['7_days', '30_days', '90_days'] as DatePreset[]).map((p) => {
                const isActive = datePreset === p;
                const label = p === '7_days' ? '7 ngày' : p === '30_days' ? '30 ngày' : '90 ngày';
                return (
                  <Pressable
                    key={p}
                    onPress={() => handleApplyDateRange(p)}
                    style={[styles.dateChip, isActive && styles.dateChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                  >
                    <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Tùy chọn Date Modal Trigger */}
              <Pressable
                onPress={() => setIsDatePickerOpen(true)}
                style={[
                  styles.dateChip,
                  datePreset === 'custom' && styles.dateChipActive,
                  styles.customDateChip,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Tùy chọn khoảng thời gian"
              >
                <Calendar size={14} color={datePreset === 'custom' ? Palette.white : Palette.secondary} strokeWidth={1.75} />
                <Text
                  style={[
                    styles.dateChipText,
                    datePreset === 'custom' && styles.dateChipTextActive,
                  ]}
                >
                  {datePreset === 'custom' ? datePresetLabel : 'Tùy chọn'}
                </Text>
              </Pressable>
            </ScrollView>

            {/* Card Filter Badge if active */}
            {selectedCardId && (
              <View style={styles.cardFilterBanner}>
                <View style={styles.cardFilterLeft}>
                  <CreditCard size={14} color={Palette.light} strokeWidth={1.75} />
                  <Text style={styles.cardFilterText}>Đang lọc theo giao dịch thẻ</Text>
                </View>
                <Pressable
                  onPress={() => setSelectedCardId(undefined)}
                  hitSlop={8}
                  style={styles.cardFilterClearBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Bỏ lọc thẻ"
                >
                  <X size={14} color={Palette.secondary} strokeWidth={2} />
                </Pressable>
              </View>
            )}

            {/* 5. Account Filter Horizontal Scroll Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountFilterRow}
            >
              {/* Option: Tất cả tài khoản */}
              <Pressable
                onPress={() => setSelectedAccountId('all')}
                style={[
                  styles.accountChip,
                  selectedAccountId === 'all' && styles.accountChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Tất cả tài khoản"
              >
                <Layers size={14} color={selectedAccountId === 'all' ? Palette.white : Palette.secondary} strokeWidth={1.75} />
                <Text
                  style={[
                    styles.accountChipText,
                    selectedAccountId === 'all' && styles.accountChipTextActive,
                  ]}
                >
                  Tất cả tài khoản
                </Text>
              </Pressable>

              {/* Individual accounts */}
              {accounts.map((acc) => {
                const isActive = selectedAccountId === acc.id;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[styles.accountChip, isActive && styles.accountChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={acc.accountName}
                  >
                    <Text
                      style={[
                        styles.accountChipText,
                        isActive && styles.accountChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {acc.accountName} ({maskAccountNumber(acc.accountNumber)})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* List Header Label */}
            <View style={styles.listHeaderTitleRow}>
              <Text style={styles.listHeaderTitle}>Danh sách giao dịch</Text>
              <Text style={styles.listHeaderCount}>
                {filteredList.length} giao dịch
              </Text>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrapper}>
            <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
            <Text style={styles.sectionHeaderCount}>({section.data.length})</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isLast = index === section.data.length - 1;
          return (
            <TransactionItem
              transaction={item}
              isLast={isLast}
              onPress={() => setSelectedTransaction(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.emptyCard}>
              <FileQuestion size={40} color={Palette.gray600} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Không có giao dịch</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery.trim().length > 0
                  ? `Không tìm thấy kết quả phù hợp với từ khóa "${searchQuery}".`
                  : 'Không có giao dịch nào phù hợp với bộ lọc đã chọn.'}
              </Text>
              <Pressable
                onPress={handleResetFilters}
                style={({ pressed }) => [styles.emptyResetBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Đặt lại bộ lọc"
              >
                <RotateCcw size={16} color={Palette.white} strokeWidth={1.75} />
                <Text style={styles.emptyResetBtnText}>Đặt lại bộ lọc</Text>
              </Pressable>
            </GlassView>
          </View>
        }
      />

      {/* Date Range Picker Modal */}
      <DateRangePickerModal
        visible={isDatePickerOpen}
        initialPreset={datePreset}
        initialCustomStart={customStart}
        initialCustomEnd={customEnd}
        onApply={handleApplyDateRange}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  resetBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  listContent: {
    paddingBottom: Spacing.huge,
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  // Summary Card
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  summaryTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(128, 108, 121, 0.12)',
    borderRadius: Radius.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryPeriod: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
  },
  summaryAccountTag: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.light,
    maxWidth: 160,
  },
  summaryColumns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(240, 217, 228, 0.12)',
    marginHorizontal: Spacing.md,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
  },
  summaryAmount: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tight,
  },
  summaryAmountIn: {
    color: Palette.incomeGreen,
  },
  summaryAmountOut: {
    color: Palette.white,
  },

  // Search
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceL2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.subheadline,
    color: Palette.white,
  },
  searchClearBtn: {
    padding: Spacing.xs,
  },

  // Type Segment
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(32, 26, 39, 0.8)',
    borderRadius: Radius.lg,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
  },
  typeTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  typeTabActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.45)',
  },
  typeTabText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  typeTabTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Date Presets Row
  datePresetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingRight: Spacing.lg,
  },
  dateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(32, 26, 39, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
  },
  dateChipActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.40)',
    borderColor: Palette.light,
  },
  customDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateChipText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  dateChipTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Card Filter Banner
  cardFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(128, 108, 121, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  cardFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardFilterText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.light,
    fontWeight: Typography.fontWeight.medium,
  },
  cardFilterClearBtn: {
    padding: 2,
  },

  // Account Filter Row
  accountFilterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(32, 26, 39, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    maxWidth: 220,
  },
  accountChipActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.45)',
    borderColor: Palette.light,
  },
  accountChipText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  accountChipTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  // List Header Title
  listHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  listHeaderTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  listHeaderCount: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },

  // Section Header
  sectionHeaderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    backgroundColor: Palette.bg,
  },
  sectionHeaderTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  sectionHeaderCount: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.gray500,
  },

  // Empty State
  emptyContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  emptyDesc: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.footnote,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.2)',
  },
  emptyResetBtnText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  btnPressed: {
    opacity: 0.75,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Detail View Styles
// ─────────────────────────────────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.sm },

  // Hero Card
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(128, 108, 121, 0.12)',
    borderRadius: Radius.xl,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  typeBadgeIn: {
    borderColor: Palette.incomeGreen,
    backgroundColor: 'rgba(50, 215, 75, 0.1)',
  },
  typeBadgeOut: {
    borderColor: Palette.secondary,
    backgroundColor: 'rgba(193, 160, 172, 0.1)',
  },
  typeBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(50, 215, 75, 0.1)',
    borderWidth: 1,
    borderColor: Palette.incomeGreen,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  heroAmount: {
    fontSize: Typography.fontSize.largeTitle,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tighter,
    marginBottom: Spacing.xs,
  },
  amountPositive: {
    color: Palette.incomeGreen,
  },
  amountNeutral: {
    color: Palette.white,
  },
  heroTitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    textAlign: 'center',
  },

  // Info Card
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.md,
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
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
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

  // Actions
  actionsContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  shareBtn: {
    height: 50,
  },
  shareBtnInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.65)',
  },
  shareBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  secondaryBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
