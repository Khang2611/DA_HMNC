import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  TextInputInstance,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PlusCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Wallet,
  Sparkles,
} from 'lucide-react-native';

import {
  Account,
  SavingsAccount,
  MaturityInstruction,
  Transaction,
} from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber, formatVNDInput } from '../utils/formatters';
import { GlassView } from '../components/GlassView';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  SAVINGS_TERMS,
  MIN_DEPOSIT_AMOUNT,
  NON_TERM_ANNUAL_RATE,
  formatDateVN,
  calculateEstimatedInterest,
  calculateSettlementInterest,
  parseDateVN,
  getMaturityInstructionLabel,
  getSavingsStatusConfig,
} from '../utils/savings';

export interface SavingsScreenProps {
  accounts: Account[];
  savingsAccounts: SavingsAccount[];
  initialAccountIndex?: number;
  onClose: () => void;
  onOpenSavingsSuccess: (newSavings: SavingsAccount, tx: Transaction) => void;
  onSettleSavingsSuccess: (
    savingsId: string,
    payoutAmount: number,
    destinationAccountId: string,
    tx: Transaction
  ) => void;
}

type SavingsView =
  | 'dashboard'
  | 'open_config'
  | 'open_confirm'
  | 'open_otp'
  | 'open_result'
  | 'details'
  | 'settle_confirm'
  | 'settle_otp'
  | 'settle_result';

const QUICK_DEPOSITS = [5000000, 10000000, 20000000, 50000000, 100000000];

export const SavingsScreen: React.FC<SavingsScreenProps> = ({
  accounts,
  savingsAccounts,
  initialAccountIndex = 0,
  onClose,
  onOpenSavingsSuccess,
  onSettleSavingsSuccess,
}) => {
  const insets = useSafeAreaInsets();

  // View state
  const [view, setView] = useState<SavingsView>('dashboard');
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');

  // Source account selection
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);
  const currentSourceAccount = accounts[selectedAccountIndex] || accounts[0];

  // ── Open Savings Form State ───────────────────────────────────────────────
  const [depositInput, setDepositInput] = useState('');
  const [rawDeposit, setRawDeposit] = useState(0);
  const [selectedTermIndex, setSelectedTermIndex] = useState(2); // 6 months default
  const [selectedInstruction, setSelectedInstruction] =
    useState<MaturityInstruction>('transfer_all');

  // Open OTP State
  const [openOtpDigits, setOpenOtpDigits] = useState(['', '', '', '', '', '']);
  const [openOtpError, setOpenOtpError] = useState('');
  const [isVerifyingOpenOtp, setIsVerifyingOpenOtp] = useState(false);
  const [openOtpCountdown, setOpenOtpCountdown] = useState(60);
  const openOtpRefs = useRef<(TextInputInstance | null)[]>([]);

  // Newly Created Savings Result
  const [createdSavings, setCreatedSavings] = useState<SavingsAccount | null>(null);

  // ── Selected Savings for Details & Settlement ─────────────────────────────
  const [selectedSavingsId, setSelectedSavingsId] = useState<string | null>(null);

  // Settlement OTP State
  const [settleOtpDigits, setSettleOtpDigits] = useState(['', '', '', '', '', '']);
  const [settleOtpError, setSettleOtpError] = useState('');
  const [isVerifyingSettleOtp, setIsVerifyingSettleOtp] = useState(false);
  const [settleOtpCountdown, setSettleOtpCountdown] = useState(60);
  const settleOtpRefs = useRef<(TextInputInstance | null)[]>([]);

  // Settled Result State
  const [settledResultData, setSettledResultData] = useState<{
    savingsId: string;
    accountNumber: string;
    payoutAmount: number;
    interestEarned: number;
    isEarly: boolean;
    appliedRate: number;
    destinationAccount: Account;
  } | null>(null);

  // ── OTP Timers ────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (view === 'open_otp' && openOtpCountdown > 0) {
      timer = setInterval(() => {
        setOpenOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, openOtpCountdown]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (view === 'settle_otp' && settleOtpCountdown > 0) {
      timer = setInterval(() => {
        setSettleOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, settleOtpCountdown]);

  // ── Calculations for Open Savings ─────────────────────────────────────────
  const selectedTerm = SAVINGS_TERMS[selectedTermIndex];
  const { interest: estimatedInterest, maturityDate: calculatedMaturityDate } =
    calculateEstimatedInterest(rawDeposit, selectedTerm.annualRate, selectedTerm.termMonths);

  const handleDepositChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    const num = parseInt(numeric, 10) || 0;
    setRawDeposit(num);
    setDepositInput(num > 0 ? formatVNDInput(num) : '');
  };

  const handleQuickDeposit = (val: number) => {
    setRawDeposit(val);
    setDepositInput(formatVNDInput(val));
  };

  const isOpenFormValid =
    rawDeposit >= MIN_DEPOSIT_AMOUNT &&
    rawDeposit <= currentSourceAccount.balance;

  // ── Open Savings Submission ───────────────────────────────────────────────
  const handleProceedToOpenOtp = () => {
    setOpenOtpDigits(['', '', '', '', '', '']);
    setOpenOtpError('');
    setOpenOtpCountdown(60);
    setView('open_otp');
  };

  const verifyAndCompleteOpen = (otpCode: string) => {
    if (isVerifyingOpenOtp) return;
    setIsVerifyingOpenOtp(true);

    setTimeout(() => {
      setIsVerifyingOpenOtp(false);
      if (otpCode === '123456') {
        const today = new Date();
        const startStr = formatDateVN(today);
        const maturityStr = formatDateVN(calculatedMaturityDate);
        const randomCode = Math.floor(1000000 + Math.random() * 9000000).toString();
        const newSavingsId = `STK${randomCode}`;

        const newSavings: SavingsAccount = {
          id: `sav_${Date.now()}`,
          accountNumber: newSavingsId,
          sourceAccountId: currentSourceAccount.id,
          principal: rawDeposit,
          termMonths: selectedTerm.termMonths,
          annualRate: selectedTerm.annualRate,
          startDate: startStr,
          maturityDate: maturityStr,
          estimatedInterest,
          maturityInstruction: selectedInstruction,
          status: 'active',
        };

        const tx: Transaction = {
          id: `tx_${Date.now()}`,
          title: `Mở sổ tiết kiệm ${newSavingsId}`,
          category: 'Tiết kiệm',
          amount: -rawDeposit,
          timestamp: 'Vừa xong',
          type: 'transfer_out',
          note: `Kỳ hạn ${selectedTerm.label} - Lãi suất ${selectedTerm.rateDisplay}/năm`,
        };

        setCreatedSavings(newSavings);
        onOpenSavingsSuccess(newSavings, tx);
        setView('open_result');
      } else {
        setOpenOtpError('Mã OTP không chính xác. Vui lòng nhập 123456 để thử nghiệm.');
        setOpenOtpDigits(['', '', '', '', '', '']);
        openOtpRefs.current[0]?.focus();
      }
    }, 600);
  };

  // ── Details & Settlement Logic ────────────────────────────────────────────
  const currentSavings = savingsAccounts.find((s) => s.id === selectedSavingsId);

  // Settlement calculations for selected savings
  let settlementCalc = {
    isEarlyWithdrawal: false,
    appliedRate: 0,
    elapsedDays: 0,
    interestEarned: 0,
    totalPayout: 0,
  };

  if (currentSavings) {
    const sDate = parseDateVN(currentSavings.startDate);
    const mDate = parseDateVN(currentSavings.maturityDate);
    settlementCalc = calculateSettlementInterest(
      currentSavings.principal,
      currentSavings.annualRate,
      sDate,
      mDate,
      new Date()
    );
  }

  const handleProceedToSettleOtp = () => {
    setSettleOtpDigits(['', '', '', '', '', '']);
    setSettleOtpError('');
    setSettleOtpCountdown(60);
    setView('settle_otp');
  };

  const verifyAndCompleteSettle = (otpCode: string) => {
    if (isVerifyingSettleOtp || !currentSavings) return;
    setIsVerifyingSettleOtp(true);

    setTimeout(() => {
      setIsVerifyingSettleOtp(false);
      if (otpCode === '123456') {
        const destAccount =
          accounts.find((a) => a.id === currentSavings.sourceAccountId) || accounts[0];

        const tx: Transaction = {
          id: `tx_${Date.now()}`,
          title: `Tất toán sổ tiết kiệm ${currentSavings.accountNumber}`,
          category: 'Tất toán tiết kiệm',
          amount: settlementCalc.totalPayout,
          timestamp: 'Vừa xong',
          type: 'transfer_in',
          note: settlementCalc.isEarlyWithdrawal
            ? `Tất toán trước hạn (Lãi suất KKH ${(NON_TERM_ANNUAL_RATE * 100).toFixed(1)}%/năm)`
            : `Tất toán đúng hạn kỳ hạn ${currentSavings.termMonths} tháng`,
        };

        setSettledResultData({
          savingsId: currentSavings.id,
          accountNumber: currentSavings.accountNumber,
          payoutAmount: settlementCalc.totalPayout,
          interestEarned: settlementCalc.interestEarned,
          isEarly: settlementCalc.isEarlyWithdrawal,
          appliedRate: settlementCalc.appliedRate,
          destinationAccount: destAccount,
        });

        onSettleSavingsSuccess(
          currentSavings.id,
          settlementCalc.totalPayout,
          destAccount.id,
          tx
        );

        setView('settle_result');
      } else {
        setSettleOtpError('Mã OTP không chính xác. Vui lòng nhập 123456 để thử nghiệm.');
        setSettleOtpDigits(['', '', '', '', '', '']);
        settleOtpRefs.current[0]?.focus();
      }
    }, 600);
  };

  // ── Derived Dashboard Metrics ─────────────────────────────────────────────
  const activeSavingsList = savingsAccounts.filter((s) => s.status !== 'settled');
  const settledSavingsList = savingsAccounts.filter((s) => s.status === 'settled');

  const totalActivePrincipal = activeSavingsList.reduce((sum, s) => sum + s.principal, 0);
  const totalActiveEstimatedInterest = activeSavingsList.reduce(
    (sum, s) => sum + s.estimatedInterest,
    0
  );

  const displayedList = activeTab === 'active' ? activeSavingsList : settledSavingsList;

  // ── Navigation Back Action ────────────────────────────────────────────────
  const handleNavBack = () => {
    switch (view) {
      case 'dashboard':
        onClose();
        break;
      case 'open_config':
        setView('dashboard');
        break;
      case 'open_confirm':
        setView('open_config');
        break;
      case 'open_otp':
        setView('open_confirm');
        break;
      case 'open_result':
        setView('dashboard');
        break;
      case 'details':
        setView('dashboard');
        break;
      case 'settle_confirm':
        setView('details');
        break;
      case 'settle_otp':
        setView('settle_confirm');
        break;
      case 'settle_result':
        setView('dashboard');
        break;
    }
  };

  const getScreenTitle = () => {
    switch (view) {
      case 'dashboard':
        return 'Tiết kiệm trực tuyến';
      case 'open_config':
        return 'Mở sổ tiết kiệm';
      case 'open_confirm':
        return 'Xác nhận mở sổ';
      case 'open_otp':
        return 'Xác thực mở sổ';
      case 'open_result':
        return 'Mở sổ thành công';
      case 'details':
        return 'Chi tiết sổ tiết kiệm';
      case 'settle_confirm':
        return 'Xác nhận tất toán';
      case 'settle_otp':
        return 'Xác thực tất toán';
      case 'settle_result':
        return 'Tất toán thành công';
    }
  };

  const scrollBottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.lg;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader title={getScreenTitle()} onBack={handleNavBack} />

      {/* ══════════════════════════════════════════════════════════════════════
          1. DASHBOARD VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'dashboard' && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Overview Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroBadge}>
                <Sparkles size={11} color={Palette.light} />
                <Text style={styles.heroBadgeText}>TIẾT KIỆM TÍCH LŨY (DEMO)</Text>
              </View>
              <Text style={styles.rateHint}>Lãi suất tới 5.8%/năm</Text>
            </View>

            <Text style={styles.heroPrincipalLabel}>TỔNG TIỀN GỬI TIẾT KIỆM</Text>
            <Text style={styles.heroPrincipalValue}>{formatVND(totalActivePrincipal)}</Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>Dự kiến lãi nhận</Text>
                <Text style={styles.heroStatValueIncome}>
                  +{formatVND(totalActiveEstimatedInterest)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>Sổ đang hoạt động</Text>
                <Text style={styles.heroStatValue}>{activeSavingsList.length} sổ</Text>
              </View>
            </View>
          </GlassView>

          {/* Primary Action: Mở sổ tiết kiệm */}
          <View style={styles.actionBlock}>
            <Pressable
              onPress={() => setView('open_config')}
              style={({ pressed }) => [styles.openSavingsActionBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Mở sổ tiết kiệm mới"
            >
              <PlusCircle size={20} color={Palette.white} strokeWidth={2} />
              <Text style={styles.openSavingsActionBtnText}>Mở sổ tiết kiệm</Text>
            </Pressable>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setActiveTab('active')}
              style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'active' && styles.tabBtnTextActive,
                ]}
              >
                Đang sinh lời ({activeSavingsList.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('settled')}
              style={[styles.tabBtn, activeTab === 'settled' && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'settled' && styles.tabBtnTextActive,
                ]}
              >
                Đã tất toán ({settledSavingsList.length})
              </Text>
            </Pressable>
          </View>

          {/* List of Savings Cards */}
          {displayedList.length === 0 ? (
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.emptyContainer}>
              <Wallet size={40} color={Palette.secondary} strokeWidth={1.5} />
              <Text style={styles.emptyHeading}>
                {activeTab === 'active'
                  ? 'Chưa có sổ tiết kiệm nào'
                  : 'Chưa có sổ tiết kiệm đã tất toán'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'active'
                  ? 'Bắt đầu tích lũy sinh lời an toàn với lãi suất ưu đãi lên tới 5.8%/năm.'
                  : 'Lịch sử tất toán các sổ tiết kiệm sẽ được lưu trữ và hiển thị tại đây.'}
              </Text>
              {activeTab === 'active' && (
                <Pressable
                  onPress={() => setView('open_config')}
                  style={styles.emptyBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.emptyBtnText}>Mở sổ ngay</Text>
                </Pressable>
              )}
            </GlassView>
          ) : (
            <View style={styles.cardsList}>
              {displayedList.map((item) => {
                const statusCfg = getSavingsStatusConfig(item.status);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedSavingsId(item.id);
                      setView('details');
                    }}
                    style={({ pressed }) => [styles.cardPressable, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Sổ tiết kiệm ${item.accountNumber}, số tiền ${formatVND(item.principal)}`}
                  >
                    <GlassView variant="card" borderRadius={Radius.lg} style={styles.savingsCard}>
                      {/* Top row */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardIdGroup}>
                          <Wallet size={16} color={Palette.light} strokeWidth={1.75} />
                          <Text style={styles.cardIdText}>{item.accountNumber}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: statusCfg.bg,
                              borderColor: statusCfg.borderColor,
                            },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                            {statusCfg.text}
                          </Text>
                        </View>
                      </View>

                      {/* Principal Value */}
                      <Text style={styles.cardPrincipalText}>{formatVND(item.principal)}</Text>

                      {/* Bottom Info Grid */}
                      <View style={styles.cardDetailsGrid}>
                        <View style={styles.cardDetailCol}>
                          <Text style={styles.cardDetailLabel}>Kỳ hạn</Text>
                          <Text style={styles.cardDetailValue}>{item.termMonths} tháng</Text>
                        </View>
                        <View style={styles.cardDetailCol}>
                          <Text style={styles.cardDetailLabel}>Lãi suất (DEMO)</Text>
                          <Text style={styles.cardDetailValue}>
                            {(item.annualRate * 100).toFixed(1)}%/năm
                          </Text>
                        </View>
                        <View style={styles.cardDetailCol}>
                          <Text style={styles.cardDetailLabel}>Đáo hạn</Text>
                          <Text style={styles.cardDetailValue}>{item.maturityDate}</Text>
                        </View>
                      </View>

                      {/* Footer: Estimated interest + Chevron */}
                      <View style={styles.cardFooterRow}>
                        <View style={styles.interestEarnedRow}>
                          <TrendingUp size={14} color={Palette.incomeGreen} />
                          <Text style={styles.interestEarnedText}>
                            Dự kiến lãi: +{formatVND(item.estimatedInterest)}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={Palette.secondary} />
                      </View>
                    </GlassView>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2. OPEN SAVINGS: STEP 1 — CONFIGURATION
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'open_config' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}
        >
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Source Account Selector */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionSmallLabel}>TÀI KHOẢN NGUỒN TRÍCH TIỀN</Text>
              <SourceAccountSelector
                account={currentSourceAccount}
                canSwitch={accounts.length > 1}
                onPress={() => {
                  if (accounts.length > 1) {
                    setSelectedAccountIndex((prev) => (prev + 1) % accounts.length);
                  }
                }}
              />
            </View>

            {/* Deposit Amount Input Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>Số tiền gửi tiết kiệm</Text>

              <View style={styles.amountInputRow}>
                <TextInput
                  value={depositInput}
                  onChangeText={handleDepositChange}
                  placeholder="Nhập số tiền"
                  placeholderTextColor="rgba(193, 160, 172, 0.45)"
                  keyboardType="numeric"
                  style={styles.amountTextInput}
                />
                <Text style={styles.currencySuffix}>VND</Text>
              </View>

              {rawDeposit > 0 && rawDeposit < MIN_DEPOSIT_AMOUNT && (
                <Text style={styles.errorText}>
                  Số tiền gửi tối thiểu là {formatVND(MIN_DEPOSIT_AMOUNT)}
                </Text>
              )}
              {rawDeposit > currentSourceAccount.balance && (
                <Text style={styles.errorText}>
                  Số dư khả dụng không đủ ({formatVND(currentSourceAccount.balance)})
                </Text>
              )}

              {/* Quick Deposit Chips */}
              <View style={styles.quickAmountsRow}>
                {QUICK_DEPOSITS.map((val) => (
                  <Pressable
                    key={val}
                    onPress={() => handleQuickDeposit(val)}
                    style={({ pressed }) => [
                      styles.quickAmountChip,
                      rawDeposit === val && styles.quickAmountChipActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        rawDeposit === val && styles.quickAmountTextActive,
                      ]}
                    >
                      {val >= 1000000 ? `${val / 1000000}Tr` : `${val / 1000}K`}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => handleQuickDeposit(currentSourceAccount.balance)}
                  style={styles.quickAmountChip}
                >
                  <Text style={styles.quickAmountText}>Tất cả</Text>
                </Pressable>
              </View>
            </GlassView>

            {/* Term Selector Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
              <Text style={styles.cardHeaderTitle}>Chọn kỳ hạn gửi (Lãi suất DEMO)</Text>

              <View style={styles.termsGrid}>
                {SAVINGS_TERMS.map((t, idx) => {
                  const isSelected = idx === selectedTermIndex;
                  return (
                    <Pressable
                      key={t.termMonths}
                      onPress={() => setSelectedTermIndex(idx)}
                      style={({ pressed }) => [
                        styles.termCard,
                        isSelected && styles.termCardActive,
                        pressed && styles.btnPressed,
                      ]}
                      accessibilityRole="button"
                    >
                      {t.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>HOT</Text>
                        </View>
                      )}
                      <Text style={[styles.termLabel, isSelected && styles.termLabelActive]}>
                        {t.label}
                      </Text>
                      <Text style={[styles.termRate, isSelected && styles.termRateActive]}>
                        {t.rateDisplay}
                      </Text>
                      <Text style={styles.termPerYear}>/năm</Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassView>

            {/* Real-time Estimated Interest Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
              <View style={styles.estimateHeaderRow}>
                <TrendingUp size={18} color={Palette.incomeGreen} />
                <Text style={styles.cardHeaderTitleNoMargin}>Ước tính lợi nhuận sinh lời</Text>
              </View>

              <View style={styles.estimateDetails}>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Ngày đáo hạn:</Text>
                  <Text style={styles.estimateValueBold}>
                    {formatDateVN(calculatedMaturityDate)}
                  </Text>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Lãi suất áp dụng:</Text>
                  <Text style={[styles.estimateValueBold, { color: Palette.light }]}>
                    {selectedTerm.rateDisplay} / năm (DEMO)
                  </Text>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Tiền lãi ước tính:</Text>
                  <Text style={[styles.estimateValueBold, { color: Palette.incomeGreen }]}>
                    +{formatVND(estimatedInterest)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.estimateRow}>
                  <Text style={styles.totalMaturityLabel}>Tổng nhận khi đáo hạn:</Text>
                  <Text style={styles.totalMaturityValue}>
                    {formatVND(rawDeposit + estimatedInterest)}
                  </Text>
                </View>
              </View>
            </GlassView>

            {/* Maturity Instruction Selector */}
            <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
              <Text style={styles.cardHeaderTitle}>Chỉ thị khi đáo hạn</Text>

              <View style={styles.instructionsList}>
                {[
                  {
                    key: 'transfer_all' as MaturityInstruction,
                    title: 'Chuyển gốc và lãi về tài khoản',
                    desc: 'Đáo hạn tự động tất toán toàn bộ về tài khoản nguồn.',
                  },
                  {
                    key: 'renew_principal' as MaturityInstruction,
                    title: 'Tái tục gốc, chuyển lãi về tài khoản',
                    desc: 'Gốc tiếp tục gửi kỳ hạn mới, lãi chuyển về tài khoản.',
                  },
                  {
                    key: 'renew_all' as MaturityInstruction,
                    title: 'Tái tục cả gốc và lãi',
                    desc: 'Toàn bộ gốc và lãi chuyển sang kỳ hạn mới (lãi kép).',
                  },
                ].map((opt) => {
                  const isSelected = selectedInstruction === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setSelectedInstruction(opt.key)}
                      style={[
                        styles.instructionItem,
                        isSelected && styles.instructionItemActive,
                      ]}
                      accessibilityRole="button"
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.instructionMeta}>
                        <Text
                          style={[
                            styles.instructionTitle,
                            isSelected && styles.instructionTitleActive,
                          ]}
                        >
                          {opt.title}
                        </Text>
                        <Text style={styles.instructionDesc}>{opt.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </GlassView>

            {/* Primary Action Button inside ScrollView */}
            <View style={styles.scrollActionWrapper}>
              <Pressable
                onPress={() => setView('open_confirm')}
                disabled={!isOpenFormValid}
                style={({ pressed }) => [
                  styles.primaryActionBtn,
                  !isOpenFormValid && styles.primaryActionBtnDisabled,
                  pressed && isOpenFormValid && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Tiếp tục"
              >
                <Text
                  style={[
                    styles.primaryActionBtnText,
                    !isOpenFormValid && styles.primaryActionBtnTextDisabled,
                  ]}
                >
                  Tiếp tục
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2. OPEN SAVINGS: STEP 2 — CONFIRMATION
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'open_confirm' && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Hero */}
          <View style={styles.confirmAmountHero}>
            <Text style={styles.confirmAmountLabel}>SỐ TIỀN MỞ SỔ TIẾT KIỆM</Text>
            <Text style={styles.confirmAmountValue}>{formatVND(rawDeposit)}</Text>
            <View style={styles.confirmFreeBadge}>
              <Text style={styles.confirmFreeBadgeText}>
                Kỳ hạn {selectedTerm.label} · Lãi suất {selectedTerm.rateDisplay}/năm (DEMO)
              </Text>
            </View>
          </View>

          {/* Details Summary Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
            <Text style={styles.cardHeaderTitle}>Chi tiết hợp đồng tiền gửi</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tài khoản nguồn</Text>
              <View style={styles.summaryRowValueCol}>
                <Text style={styles.summaryRowValueBold}>{currentSourceAccount.accountName}</Text>
                <Text style={styles.summaryRowValueSub}>
                  {maskAccountNumber(currentSourceAccount.accountNumber)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Kỳ hạn gửi</Text>
              <Text style={styles.summaryRowValueBold}>{selectedTerm.label}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Lãi suất niêm yết</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                {selectedTerm.rateDisplay} / năm (DEMO)
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ngày mở sổ</Text>
              <Text style={styles.summaryRowValueBold}>{formatDateVN(new Date())}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ngày đáo hạn</Text>
              <Text style={styles.summaryRowValueBold}>
                {formatDateVN(calculatedMaturityDate)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tiền lãi dự kiến</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                +{formatVND(estimatedInterest)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Chỉ thị khi đáo hạn</Text>
              <Text style={[styles.summaryRowValueBold, { flex: 1, textAlign: 'right' }]}>
                {getMaturityInstructionLabel(selectedInstruction)}
              </Text>
            </View>
          </GlassView>

          {/* Action Buttons */}
          <View style={styles.scrollActionWrapper}>
            <Pressable
              onPress={handleProceedToOpenOtp}
              style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Xác nhận và xác thực OTP"
            >
              <ShieldCheck size={20} color={Palette.white} strokeWidth={2} />
              <Text style={styles.primaryActionBtnText}>Xác nhận &amp; Xác thực</Text>
            </Pressable>

            <Pressable
              onPress={() => setView('open_config')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Chỉnh sửa thông tin"
            >
              <Text style={styles.secondaryBtnText}>Chỉnh sửa thông tin</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2. OPEN SAVINGS: STEP 3 — SMART OTP
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'open_otp' && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.otpContainer}>
            <View style={styles.otpShieldCircle}>
              <ShieldCheck size={36} color={Palette.light} strokeWidth={1.75} />
            </View>

            <Text style={styles.otpHeading}>Nhập mã xác thực mở sổ tiết kiệm</Text>
            <Text style={styles.otpSubheading}>
              Mã bảo mật OTP đã được gửi đến số điện thoại đăng ký cho giao dịch gửi{' '}
              <Text style={{ color: Palette.light, fontWeight: '600' }}>
                {formatVND(rawDeposit)}
              </Text>
              .
            </Text>

            {/* Demo Helper Banner */}
            <View style={styles.demoBanner}>
              <Text style={styles.demoBannerText}>
                ⚠️ Giao dịch mô phỏng (Demo) — Nhập mã OTP:{' '}
                <Text style={{ fontWeight: '700', color: Palette.light }}>123456</Text>
              </Text>
            </View>

            {/* 6 Digit Input Boxes */}
            <View style={styles.otpInputsRow}>
              {openOtpDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => {
                    openOtpRefs.current[idx] = el;
                  }}
                  value={digit}
                  onChangeText={(val) => {
                    const d = val.slice(-1);
                    const arr = [...openOtpDigits];
                    arr[idx] = d;
                    setOpenOtpDigits(arr);
                    setOpenOtpError('');
                    if (d.length > 0 && idx < 5) {
                      openOtpRefs.current[idx + 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && openOtpDigits[idx] === '' && idx > 0) {
                      openOtpRefs.current[idx - 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[
                    styles.otpBox,
                    digit.length > 0 && styles.otpBoxFilled,
                    openOtpError.length > 0 && styles.otpBoxError,
                  ]}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {openOtpError.length > 0 && <Text style={styles.otpErrorText}>{openOtpError}</Text>}

            {isVerifyingOpenOtp && (
              <View style={styles.verifyingRow}>
                <ActivityIndicator size="small" color={Palette.light} />
                <Text style={styles.verifyingText}>Đang xác thực giao dịch...</Text>
              </View>
            )}

            {/* Countdown / Resend */}
            <View style={styles.otpResendSection}>
              {openOtpCountdown > 0 ? (
                <Text style={styles.otpCountdownText}>
                  Gửi lại mã OTP sau {openOtpCountdown}s
                </Text>
              ) : (
                <Pressable
                  onPress={() => setOpenOtpCountdown(60)}
                  style={styles.resendBtn}
                  accessibilityRole="button"
                >
                  <RefreshCw size={14} color={Palette.light} />
                  <Text style={styles.resendBtnText}>Gửi lại mã OTP mới</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.scrollActionWrapper}>
              <Pressable
                onPress={() => verifyAndCompleteOpen(openOtpDigits.join(''))}
                disabled={openOtpDigits.join('').length < 6 || isVerifyingOpenOtp}
                style={({ pressed }) => [
                  styles.primaryActionBtn,
                  (openOtpDigits.join('').length < 6 || isVerifyingOpenOtp) &&
                    styles.primaryActionBtnDisabled,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Xác nhận mở sổ"
              >
                <Text style={styles.primaryActionBtnText}>Xác nhận mở sổ tiết kiệm</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2. OPEN SAVINGS: STEP 4 — RESULT
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'open_result' && createdSavings && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Status Hero */}
          <View style={styles.resultHero}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color={Palette.incomeGreen} strokeWidth={2.2} />
            </View>
            <Text style={styles.resultHeading}>Mở sổ tiết kiệm thành công!</Text>
            <Text style={styles.resultAmount}>{formatVND(createdSavings.principal)}</Text>
            <View style={styles.simulatedDemoBadge}>
              <Text style={styles.simulatedDemoBadgeText}>HỢP ĐỒNG TIẾT KIỆM ĐIỆN TỬ (DEMO)</Text>
            </View>
          </View>

          {/* Receipt Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Mã số sổ tiết kiệm</Text>
              <Text style={[styles.summaryRowValueBold, { letterSpacing: 0.5 }]}>
                {createdSavings.accountNumber}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Kỳ hạn gửi</Text>
              <Text style={styles.summaryRowValueBold}>{createdSavings.termMonths} tháng</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Lãi suất niêm yết (DEMO)</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                {(createdSavings.annualRate * 100).toFixed(1)}%/năm
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ngày mở sổ</Text>
              <Text style={styles.summaryRowValueBold}>{createdSavings.startDate}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ngày đáo hạn</Text>
              <Text style={styles.summaryRowValueBold}>{createdSavings.maturityDate}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tiền lãi dự kiến</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                +{formatVND(createdSavings.estimatedInterest)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Chỉ thị khi đáo hạn</Text>
              <Text style={[styles.summaryRowValueBold, { flex: 1, textAlign: 'right' }]}>
                {getMaturityInstructionLabel(createdSavings.maturityInstruction)}
              </Text>
            </View>
          </GlassView>

          {/* Actions */}
          <View style={styles.scrollActionWrapper}>
            <Pressable
              onPress={() => {
                setSelectedSavingsId(createdSavings.id);
                setView('details');
              }}
              style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionBtnText}>Xem chi tiết sổ tiết kiệm</Text>
            </Pressable>

            <Pressable
              onPress={() => setView('dashboard')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Về danh sách sổ tiết kiệm</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          3. SAVINGS DETAILS VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'details' && currentSavings && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.detailsHeaderCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIdGroup}>
                <Wallet size={18} color={Palette.light} />
                <Text style={styles.detailsIdText}>{currentSavings.accountNumber}</Text>
              </View>
              {(() => {
                const cfg = getSavingsStatusConfig(currentSavings.status);
                return (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: cfg.bg, borderColor: cfg.borderColor },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                      {cfg.text}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <Text style={styles.detailsPrincipalLabel}>TIỀN GỐC GỬI TIẾT KIỆM</Text>
            <Text style={styles.detailsPrincipalValue}>{formatVND(currentSavings.principal)}</Text>

            <View style={styles.detailsSummaryPill}>
              <Text style={styles.detailsSummaryPillText}>
                Lãi dự kiến khi đáo hạn: +{formatVND(currentSavings.estimatedInterest)}
              </Text>
            </View>
          </GlassView>

          {/* Details Specifications Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
            <Text style={styles.cardHeaderTitle}>Thông tin chi tiết sổ</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Kỳ hạn tiền gửi</Text>
              <Text style={styles.summaryRowValueBold}>{currentSavings.termMonths} tháng</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Lãi suất niêm yết (DEMO)</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                {(currentSavings.annualRate * 100).toFixed(1)}% / năm
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ngày mở sổ</Text>
              <Text style={styles.summaryRowValueBold}>{currentSavings.startDate}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Ngày đáo hạn</Text>
              <Text style={styles.summaryRowValueBold}>{currentSavings.maturityDate}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Chỉ thị khi đáo hạn</Text>
              <Text style={[styles.summaryRowValueBold, { flex: 1, textAlign: 'right' }]}>
                {getMaturityInstructionLabel(currentSavings.maturityInstruction)}
              </Text>
            </View>

            {currentSavings.status === 'settled' && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Ngày tất toán</Text>
                  <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                    {currentSavings.settledDate}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Tổng tiền đã nhận</Text>
                  <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                    {formatVND(currentSavings.settledAmount || currentSavings.principal)}
                  </Text>
                </View>
              </>
            )}
          </GlassView>

          {/* Settlement Section (If active) */}
          {currentSavings.status !== 'settled' && (
            <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
              <View style={styles.settleNoticeHeader}>
                <AlertTriangle size={18} color={Palette.warning} />
                <Text style={styles.settleNoticeTitle}>Chính sách tất toán sổ tiết kiệm</Text>
              </View>

              <Text style={styles.settleNoticeText}>
                {settlementCalc.isEarlyWithdrawal
                  ? `Sổ chưa đến hạn ngày ${currentSavings.maturityDate}. Nếu tất toán trước hạn, lãi suất áp dụng là ${(NON_TERM_ANNUAL_RATE * 100).toFixed(1)}%/năm (không kỳ hạn) cho ${settlementCalc.elapsedDays} ngày thực gửi.`
                  : 'Sổ tiết kiệm đã đến hạn tất toán. Toàn bộ tiền gốc và lãi suất thỏa thuận sẽ được thanh toán.'}
              </Text>

              <View style={styles.settlePreviewBox}>
                <View style={styles.settlePreviewRow}>
                  <Text style={styles.settlePreviewLabel}>Tiền gốc nhận lại:</Text>
                  <Text style={styles.settlePreviewValue}>
                    {formatVND(currentSavings.principal)}
                  </Text>
                </View>
                <View style={styles.settlePreviewRow}>
                  <Text style={styles.settlePreviewLabel}>
                    Tiền lãi nhận {settlementCalc.isEarlyWithdrawal ? '(Trước hạn)' : '(Đúng hạn)'}:
                  </Text>
                  <Text style={[styles.settlePreviewValue, { color: Palette.incomeGreen }]}>
                    +{formatVND(settlementCalc.interestEarned)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.settlePreviewRow}>
                  <Text style={styles.settleTotalLabel}>Tổng nhận nếu tất toán:</Text>
                  <Text style={styles.settleTotalValue}>
                    {formatVND(settlementCalc.totalPayout)}
                  </Text>
                </View>
              </View>

              {/* Settlement Button */}
              <Pressable
                onPress={() => setView('settle_confirm')}
                style={({ pressed }) => [styles.settleActionBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Tất toán sổ tiết kiệm"
              >
                <Text style={styles.settleActionBtnText}>Tất toán sổ tiết kiệm</Text>
              </Pressable>
            </GlassView>
          )}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. SETTLEMENT: STEP 1 — CONFIRMATION
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'settle_confirm' && currentSavings && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Payout Hero */}
          <View style={styles.confirmAmountHero}>
            <Text style={styles.confirmAmountLabel}>TỔNG TIỀN THỰC NHẬN KHI TẤT TOÁN</Text>
            <Text style={[styles.confirmAmountValue, { color: Palette.incomeGreen }]}>
              {formatVND(settlementCalc.totalPayout)}
            </Text>
            <View
              style={[
                styles.confirmFreeBadge,
                settlementCalc.isEarlyWithdrawal && {
                  backgroundColor: 'rgba(255, 149, 0, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.confirmFreeBadgeText,
                  settlementCalc.isEarlyWithdrawal && { color: Palette.warning },
                ]}
              >
                {settlementCalc.isEarlyWithdrawal
                  ? `Tất toán trước hạn · Áp dụng ${(NON_TERM_ANNUAL_RATE * 100).toFixed(1)}%/năm KKH`
                  : 'Tất toán đúng hạn · Hưởng trọn lãi suất kỳ hạn'}
              </Text>
            </View>
          </View>

          {/* Settlement Details Summary Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
            <Text style={styles.cardHeaderTitle}>Chi tiết tất toán sổ {currentSavings.accountNumber}</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tiền gốc gửi</Text>
              <Text style={styles.summaryRowValueBold}>
                {formatVND(currentSavings.principal)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Số ngày thực gửi</Text>
              <Text style={styles.summaryRowValueBold}>{settlementCalc.elapsedDays} ngày</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Lãi suất áp dụng</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                {(settlementCalc.appliedRate * 100).toFixed(2)}%/năm (DEMO)
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tiền lãi thực nhận</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                +{formatVND(settlementCalc.interestEarned)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tài khoản thụ hưởng</Text>
              <View style={styles.summaryRowValueCol}>
                <Text style={styles.summaryRowValueBold}>{currentSourceAccount.accountName}</Text>
                <Text style={styles.summaryRowValueSub}>
                  {maskAccountNumber(currentSourceAccount.accountNumber)}
                </Text>
              </View>
            </View>
          </GlassView>

          {/* Action Buttons */}
          <View style={styles.scrollActionWrapper}>
            <Pressable
              onPress={handleProceedToSettleOtp}
              style={({ pressed }) => [styles.settleActionBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Xác nhận và xác thực OTP tất toán"
            >
              <ShieldCheck size={20} color={Palette.white} strokeWidth={2} />
              <Text style={styles.settleActionBtnText}>Xác nhận tất toán sổ</Text>
            </Pressable>

            <Pressable
              onPress={() => setView('details')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Hủy bỏ"
            >
              <Text style={styles.secondaryBtnText}>Hủy bỏ</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. SETTLEMENT: STEP 2 — SMART OTP
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'settle_otp' && currentSavings && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.otpContainer}>
            <View style={styles.otpShieldCircle}>
              <ShieldCheck size={36} color={Palette.light} strokeWidth={1.75} />
            </View>

            <Text style={styles.otpHeading}>Nhập mã xác thực tất toán sổ</Text>
            <Text style={styles.otpSubheading}>
              Mã bảo mật OTP đã được tạo cho giao dịch tất toán sổ {currentSavings.accountNumber},{' '}
              chuyển{' '}
              <Text style={{ color: Palette.light, fontWeight: '600' }}>
                {formatVND(settlementCalc.totalPayout)}
              </Text>{' '}
              vào tài khoản nguồn.
            </Text>

            {/* Demo Helper Banner */}
            <View style={styles.demoBanner}>
              <Text style={styles.demoBannerText}>
                ⚠️ Giao dịch mô phỏng (Demo) — Nhập mã OTP:{' '}
                <Text style={{ fontWeight: '700', color: Palette.light }}>123456</Text>
              </Text>
            </View>

            {/* 6 Digit Input Boxes */}
            <View style={styles.otpInputsRow}>
              {settleOtpDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => {
                    settleOtpRefs.current[idx] = el;
                  }}
                  value={digit}
                  onChangeText={(val) => {
                    const d = val.slice(-1);
                    const arr = [...settleOtpDigits];
                    arr[idx] = d;
                    setSettleOtpDigits(arr);
                    setSettleOtpError('');
                    if (d.length > 0 && idx < 5) {
                      settleOtpRefs.current[idx + 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && settleOtpDigits[idx] === '' && idx > 0) {
                      settleOtpRefs.current[idx - 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[
                    styles.otpBox,
                    digit.length > 0 && styles.otpBoxFilled,
                    settleOtpError.length > 0 && styles.otpBoxError,
                  ]}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {settleOtpError.length > 0 && (
              <Text style={styles.otpErrorText}>{settleOtpError}</Text>
            )}

            {isVerifyingSettleOtp && (
              <View style={styles.verifyingRow}>
                <ActivityIndicator size="small" color={Palette.light} />
                <Text style={styles.verifyingText}>Đang xác thực giao dịch tất toán...</Text>
              </View>
            )}

            {/* Countdown / Resend */}
            <View style={styles.otpResendSection}>
              {settleOtpCountdown > 0 ? (
                <Text style={styles.otpCountdownText}>
                  Gửi lại mã OTP sau {settleOtpCountdown}s
                </Text>
              ) : (
                <Pressable
                  onPress={() => setSettleOtpCountdown(60)}
                  style={styles.resendBtn}
                  accessibilityRole="button"
                >
                  <RefreshCw size={14} color={Palette.light} />
                  <Text style={styles.resendBtnText}>Gửi lại mã OTP mới</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.scrollActionWrapper}>
              <Pressable
                onPress={() => verifyAndCompleteSettle(settleOtpDigits.join(''))}
                disabled={settleOtpDigits.join('').length < 6 || isVerifyingSettleOtp}
                style={({ pressed }) => [
                  styles.settleActionBtn,
                  (settleOtpDigits.join('').length < 6 || isVerifyingSettleOtp) &&
                    styles.primaryActionBtnDisabled,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Xác thực tất toán"
              >
                <Text style={styles.settleActionBtnText}>Xác nhận tất toán sổ</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. SETTLEMENT: STEP 3 — RESULT
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'settle_result' && settledResultData && (
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Status Hero */}
          <View style={styles.resultHero}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color={Palette.incomeGreen} strokeWidth={2.2} />
            </View>
            <Text style={styles.resultHeading}>Tất toán sổ tiết kiệm thành công!</Text>
            <Text style={[styles.resultAmount, { color: Palette.incomeGreen }]}>
              +{formatVND(settledResultData.payoutAmount)}
            </Text>
            <View style={styles.simulatedDemoBadge}>
              <Text style={styles.simulatedDemoBadgeText}>TIỀN ĐÃ CỘNG VÀO TÀI KHOẢN (DEMO)</Text>
            </View>
          </View>

          {/* Receipt Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Sổ tiết kiệm đã đóng</Text>
              <Text style={[styles.summaryRowValueBold, { letterSpacing: 0.5 }]}>
                {settledResultData.accountNumber}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Hình thức tất toán</Text>
              <Text style={styles.summaryRowValueBold}>
                {settledResultData.isEarly ? 'Tất toán trước hạn' : 'Tất toán đúng hạn'}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Lãi suất áp dụng</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                {(settledResultData.appliedRate * 100).toFixed(2)}%/năm
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tiền lãi đã cộng</Text>
              <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                +{formatVND(settledResultData.interestEarned)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Tài khoản nhận tiền</Text>
              <View style={styles.summaryRowValueCol}>
                <Text style={styles.summaryRowValueBold}>
                  {settledResultData.destinationAccount.accountName}
                </Text>
                <Text style={styles.summaryRowValueSub}>
                  {maskAccountNumber(settledResultData.destinationAccount.accountNumber)}
                </Text>
              </View>
            </View>
          </GlassView>

          {/* Actions */}
          <View style={styles.scrollActionWrapper}>
            <Pressable
              onPress={() => setView('dashboard')}
              style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionBtnText}>Về danh sách sổ tiết kiệm</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  flexOne: {
    flex: 1,
  },
  btnPressed: {
    opacity: 0.75,
  },

  // ── Scroll Content ────────────────────────────
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  sectionBlock: {
    marginBottom: Spacing.md,
  },
  sectionSmallLabel: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
  },

  // ── Hero Overview Card ────────────────────────
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.wider,
  },
  rateHint: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  heroPrincipalLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  heroPrincipalValue: {
    fontSize: Typography.fontSize.largeTitle,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
    marginVertical: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(193, 160, 172, 0.10)',
  },
  heroStatItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(193, 160, 172, 0.12)',
    marginHorizontal: Spacing.md,
  },
  heroStatLabel: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginBottom: 2,
  },
  heroStatValueIncome: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
  },
  heroStatValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },

  // ── Primary Action Block ──────────────────────
  actionBlock: {
    marginBottom: Spacing.lg,
  },
  openSavingsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    borderWidth: 1,
    borderColor: Palette.light,
  },
  openSavingsActionBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },

  // ── Filter Tabs ───────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(48, 38, 56, 0.45)',
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.50)',
  },
  tabBtnText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  tabBtnTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  // ── Savings Cards ─────────────────────────────
  cardsList: {
    gap: Spacing.md,
  },
  cardPressable: {
    borderRadius: Radius.lg,
  },
  savingsCard: {
    padding: Spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardIdText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
  cardPrincipalText: {
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginBottom: Spacing.md,
  },
  cardDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(193, 160, 172, 0.10)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.10)',
  },
  cardDetailCol: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 10,
    color: Palette.secondary,
    marginBottom: 2,
  },
  cardDetailValue: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  interestEarnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  interestEarnedText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.incomeGreen,
  },

  // ── Empty State ───────────────────────────────
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptyHeading: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  emptyBtnText: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.subheadline,
  },

  // ── Open Form Styles ──────────────────────────
  formCard: {
    padding: Spacing.lg,
  },
  cardHeaderTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.tight,
  },
  cardHeaderTitleNoMargin: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 19, 31, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  amountTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  currencySuffix: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.expenseRed,
    marginTop: Spacing.xs,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  quickAmountChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
  },
  quickAmountChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.light,
  },
  quickAmountText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  quickAmountTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.bold,
  },

  // ── Terms Grid ────────────────────────────────
  termsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  termCard: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
    alignItems: 'center',
    position: 'relative',
  },
  termCardActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.40)',
    borderColor: Palette.light,
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: 4,
    backgroundColor: Palette.warning,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  termLabel: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  termLabelActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  termRate: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    marginTop: 2,
  },
  termRateActive: {
    color: Palette.white,
  },
  termPerYear: {
    fontSize: 9,
    color: Palette.secondary,
  },

  // ── Estimate Box ──────────────────────────────
  estimateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  estimateDetails: {
    gap: Spacing.sm,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  estimateValueBold: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(193, 160, 172, 0.10)',
    marginVertical: Spacing.xs,
  },
  totalMaturityLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  totalMaturityValue: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
  },

  // ── Maturity Instructions ─────────────────────
  instructionsList: {
    gap: Spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(22, 19, 31, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
  },
  instructionItemActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderColor: Palette.light,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: Palette.light,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.light,
  },
  instructionMeta: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  instructionTitleActive: {
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },
  instructionDesc: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Confirmation Hero ─────────────────────────
  confirmAmountHero: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  confirmAmountLabel: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
  },
  confirmAmountValue: {
    fontSize: Typography.fontSize.largeTitle,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  confirmFreeBadge: {
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(128, 108, 121, 0.30)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.20)',
  },
  confirmFreeBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },

  // ── Summary Card ──────────────────────────────
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryRowLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    flex: 1,
  },
  summaryRowValueCol: {
    alignItems: 'flex-end',
    flex: 1.5,
  },
  summaryRowValueBold: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  summaryRowValueSub: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(193, 160, 172, 0.10)',
    marginVertical: Spacing.xs,
  },

  // ── OTP Styles ────────────────────────────────
  otpContainer: {
    width: '100%',
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  otpShieldCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  otpHeading: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  otpSubheading: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  demoBanner: {
    backgroundColor: 'rgba(128, 108, 121, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.25)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  demoBannerText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.light,
    textAlign: 'center',
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(48, 38, 56, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  otpBoxFilled: {
    borderColor: Palette.light,
    backgroundColor: 'rgba(128, 108, 121, 0.40)',
  },
  otpBoxError: {
    borderColor: Palette.expenseRed,
  },
  otpErrorText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.expenseRed,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  verifyingText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.light,
  },
  otpResendSection: {
    marginTop: Spacing.lg,
  },
  otpCountdownText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  resendBtnText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },

  // ── Result Hero ───────────────────────────────
  resultHero: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(52, 199, 89, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultHeading: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginBottom: Spacing.xs,
  },
  resultAmount: {
    fontSize: Typography.fontSize.largeTitle,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  simulatedDemoBadge: {
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  simulatedDemoBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.wider,
  },

  // ── Details View ──────────────────────────────
  detailsHeaderCard: {
    padding: Spacing.lg,
  },
  detailsIdText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  detailsPrincipalLabel: {
    fontSize: 10,
    color: Palette.secondary,
    marginTop: Spacing.md,
    letterSpacing: 0.5,
  },
  detailsPrincipalValue: {
    fontSize: Typography.fontSize.largeTitle,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginVertical: 4,
  },
  detailsSummaryPill: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  detailsSummaryPillText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.incomeGreen,
  },

  // Settle Notice & Preview Box
  settleNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  settleNoticeTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.warning,
  },
  settleNoticeText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  settlePreviewBox: {
    backgroundColor: 'rgba(22, 19, 31, 0.65)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    marginBottom: Spacing.md,
  },
  settlePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlePreviewLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  settlePreviewValue: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  settleTotalLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  settleTotalValue: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
  },
  settleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 69, 58, 0.25)',
    borderWidth: 1,
    borderColor: Palette.expenseRed,
  },
  settleActionBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },

  // ── Action Buttons ────────────────────────────
  scrollActionWrapper: {
    marginTop: Spacing.xl,
    width: '100%',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    borderWidth: 1,
    borderColor: Palette.light,
  },
  primaryActionBtnDisabled: {
    opacity: 0.5,
  },
  primaryActionBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  primaryActionBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(48, 38, 56, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.22)',
    marginTop: Spacing.md,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
});
