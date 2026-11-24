import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  TextInputInstance,
  Modal,
  Platform,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Smartphone,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react-native';

import { Account, Transaction, MobileServiceTab, DataPackage } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber } from '../utils/formatters';
import { GlassView } from '../components/GlassView';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { ScreenHeader } from '../components/ScreenHeader';
import { getDataPackagesByCarrier, detectCarrierByPrefix } from '../data/mockDataPackages';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

export interface MobileTopUpScreenProps {
  accounts: Account[];
  initialAccountIndex?: number;
  initialServiceTab?: MobileServiceTab;
  onClose: () => void;
  onTopUpSuccess?: (tx: Transaction, sourceAccountId?: string) => void;
}

type TopUpStep = 'form' | 'confirmation' | 'otp' | 'result';

interface Carrier {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

const CARRIERS: Carrier[] = [
  { id: 'viettel',      name: 'Viettel',       shortName: 'VIETTEL',      color: '#E31937' },
  { id: 'vinaphone',    name: 'VinaPhone',      shortName: 'VINAPHONE',    color: '#0066B3' },
  { id: 'mobifone',     name: 'MobiFone',       shortName: 'MOBIFONE',     color: '#F47920' },
  { id: 'vietnamobile', name: 'Vietnamobile',   shortName: 'VIETNAMOBILE', color: '#6CBB3C' },
];

const DENOMINATIONS = [10000, 20000, 50000, 100000, 200000, 500000];

const RECENT_NUMBERS = [
  { phone: '0901 234 567', carrier: 'viettel'   },
  { phone: '0771 234 567', carrier: 'mobifone'  },
  { phone: '0881 234 567', carrier: 'vinaphone' },
];

interface TopUpPayload {
  serviceType:       MobileServiceTab;
  sourceAccountId:   string;
  phone:             string;
  carrier:           Carrier;
  amount:            number;
  dataPackage?:      DataPackage;
  fee:               number;
  transactionCode:   string;
  timestamp:         string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LiquidGlassButton (self-contained, same as TransferMoneyScreen)
// ─────────────────────────────────────────────────────────────────────────────

interface LiquidGlassButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  style,
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.glassBtnPressable,
      pressed && !disabled && !loading && styles.glassBtnPressed,
      style,
    ]}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <GlassView
      variant="dark"
      luminousBorder
      useBlur={false}
      borderRadius={Radius.lg}
      style={[styles.glassBtnContainer, disabled && styles.glassBtnDisabled]}
    >
      {/* Mauve brand tint */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: disabled ? 'rgba(48, 38, 56, 0.40)' : 'rgba(128, 108, 121, 0.35)',
            borderRadius: Radius.lg,
          },
        ]}
      />
      <View style={styles.glassBtnContent}>
        {loading ? (
          <ActivityIndicator size="small" color={Palette.light} />
        ) : (
          <View style={styles.btnInnerRow}>
            {iconPosition === 'left' && icon && <View style={styles.btnIconLeft}>{icon}</View>}
            <Text style={[styles.glassBtnText, disabled && styles.glassBtnTextDisabled]}>
              {title}
            </Text>
            {iconPosition === 'right' && icon && <View style={styles.btnIconRight}>{icon}</View>}
          </View>
        )}
      </View>
    </GlassView>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export const MobileTopUpScreen: React.FC<MobileTopUpScreenProps> = ({
  accounts,
  initialAccountIndex = 0,
  initialServiceTab = 'topup',
  onClose,
  onTopUpSuccess,
}) => {
  const insets = useSafeAreaInsets();

  // Active Service Tab ('topup' | 'data')
  const [activeTab, setActiveTab] = useState<MobileServiceTab>(initialServiceTab);

  // Step
  const [step, setStep] = useState<TopUpStep>('form');

  // Source account
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);

  // Form: Common
  const [phone, setPhone] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>(CARRIERS[0]);
  const hasUserSelectedCarrierManually = useRef<boolean>(false);

  // Form: TopUp specific
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  // Form: Data specific
  const [selectedPackage, setSelectedPackage] = useState<DataPackage | null>(null);

  // OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const otpInputRefs = useRef<(TextInputInstance | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result
  const [completedPayload, setCompletedPayload] = useState<TopUpPayload | null>(null);

  const currentAccount = accounts[selectedAccountIndex] || accounts[0];

  // Available packages for current carrier
  const availablePackages = getDataPackagesByCarrier(selectedCarrier.id);

  // ── Derived validation ───────────────────────────────────────────────────
  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = /^0[3-9]\d{8}$/.test(cleanPhone);

  const isTopUpValid =
    isPhoneValid &&
    selectedAmount !== null &&
    selectedAmount > 0 &&
    selectedAmount <= currentAccount.balance;

  const isDataValid =
    isPhoneValid &&
    selectedPackage !== null &&
    selectedPackage.price > 0 &&
    selectedPackage.price <= currentAccount.balance;

  const isFormValid = activeTab === 'topup' ? isTopUpValid : isDataValid;

  const activeAmount = activeTab === 'topup' ? (selectedAmount ?? 0) : (selectedPackage?.price ?? 0);

  // ── Tab switching ────────────────────────────────────────────────────────
  const handleTabSwitch = (tab: MobileServiceTab) => {
    setActiveTab(tab);
    // Preserves phone, selectedCarrier, and selectedAccountIndex
  };

  // ── Phone formatting & Prefix suggestion ─────────────────────────────────
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    // Format: 0XXX XXX XXX
    let formatted = digits;
    if (digits.length > 4 && digits.length <= 7) {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    setPhone(formatted);

    // Subtle prefix suggestion: only if user has not manually overridden the carrier
    if (!hasUserSelectedCarrierManually.current && digits.length >= 3) {
      const suggestedCarrierId = detectCarrierByPrefix(digits);
      if (suggestedCarrierId && suggestedCarrierId !== selectedCarrier.id) {
        const found = CARRIERS.find((c) => c.id === suggestedCarrierId);
        if (found) {
          setSelectedCarrier(found);
          // If carrier changed, clear selected package if no longer valid
          if (selectedPackage && selectedPackage.carrier !== found.id) {
            setSelectedPackage(null);
          }
        }
      }
    }
  };

  // ── Carrier selection ────────────────────────────────────────────────────
  const handleSelectCarrier = (carrier: Carrier) => {
    hasUserSelectedCarrierManually.current = true;
    setSelectedCarrier(carrier);
    // If carrier changes, clear a selected package that is no longer valid
    if (selectedPackage && selectedPackage.carrier !== carrier.id) {
      setSelectedPackage(null);
    }
  };

  // ── Recent numbers ───────────────────────────────────────────────────────
  const handleSelectRecent = (recent: { phone: string; carrier: string }) => {
    setPhone(recent.phone);
    hasUserSelectedCarrierManually.current = true;
    const c = CARRIERS.find((item) => item.id === recent.carrier);
    if (c) {
      setSelectedCarrier(c);
      if (selectedPackage && selectedPackage.carrier !== c.id) {
        setSelectedPackage(null);
      }
    }
  };

  // ── OTP helpers ──────────────────────────────────────────────────────────
  const startOtpCountdown = () => {
    setOtpCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    setOtpError('');
    if (digit && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleResendOtp = () => startOtpCountdown();

  // ── Flow ─────────────────────────────────────────────────────────────────
  const handleProceedToConfirmation = () => {
    if (!isFormValid) return;
    setStep('confirmation');
  };

  const handleProceedToOtp = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    startOtpCountdown();
    setStep('otp');
  };

  const verifyAndComplete = (otp: string) => {
    if (isVerifyingOtp || completedPayload) return;
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      if (otp === '123456') {
        const timestamp = new Date();
        const formattedDate = `${timestamp.toLocaleDateString('vi-VN')} ${timestamp.toLocaleTimeString('vi-VN')}`;
        const isData = activeTab === 'data';
        const txCode = isData
          ? `DT${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`
          : `NP${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

        const payload: TopUpPayload = {
          serviceType: activeTab,
          sourceAccountId: currentAccount.id,
          phone: phone.trim(),
          carrier: selectedCarrier,
          amount: activeAmount,
          dataPackage: isData ? selectedPackage ?? undefined : undefined,
          fee: 0,
          transactionCode: txCode,
          timestamp: formattedDate,
        };
        setCompletedPayload(payload);

        // Notify parent: deduct balance + add tx
        const newTx: Transaction = {
          id: `tx_${Date.now()}`,
          title: isData
            ? `Gói Data ${selectedPackage!.name} - ${phone.trim()}`
            : `Nạp điện thoại ${phone.trim()}`,
          category: isData ? 'Gói cước Data' : 'Nạp điện thoại',
          amount: -activeAmount,
          timestamp: 'Vừa xong',
          type: isData ? 'data_package' : 'topup',
          note: isData
            ? `${selectedCarrier.name} · ${selectedPackage!.name} (${selectedPackage!.dataAllowance}/${selectedPackage!.validityDays} ngày) · ${txCode}`
            : `${selectedCarrier.name} · ${txCode}`,
        };
        onTopUpSuccess?.(newTx, currentAccount.id);
        setStep('result');
      } else {
        setOtpError('Mã OTP không chính xác. Nhập 123456 để thử nghiệm.');
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    }, 700);
  };

  const handleShareReceipt = async () => {
    if (!completedPayload) return;
    try {
      const isData = completedPayload.serviceType === 'data';
      const shareMessage =
        isData && completedPayload.dataPackage
          ? `[MAUVE DIGITAL BANKING - BIÊN LAI GÓI DATA/5G]\n` +
            `Trạng thái: Thành công (Mô phỏng)\n` +
            `Gói cước: ${completedPayload.dataPackage.name} (${completedPayload.dataPackage.dataAllowance})\n` +
            `Thời hạn: ${completedPayload.dataPackage.validityDays} ngày\n` +
            `Số điện thoại: ${completedPayload.phone}\n` +
            `Nhà mạng: ${completedPayload.carrier.name}\n` +
            `Số tiền: ${formatVND(completedPayload.amount)}\n` +
            `Phí: Miễn phí\n` +
            `Mã giao dịch: ${completedPayload.transactionCode}\n` +
            `Thời gian: ${completedPayload.timestamp}`
          : `[MAUVE DIGITAL BANKING - BIÊN LAI NẠP ĐIỆN THOẠI]\n` +
            `Trạng thái: Thành công (Mô phỏng)\n` +
            `Số điện thoại: ${completedPayload.phone}\n` +
            `Nhà mạng: ${completedPayload.carrier.name}\n` +
            `Số tiền: ${formatVND(completedPayload.amount)}\n` +
            `Phí: Miễn phí\n` +
            `Mã giao dịch: ${completedPayload.transactionCode}\n` +
            `Thời gian: ${completedPayload.timestamp}`;

      await Share.share({
        title: isData ? 'Biên lai gói data Mauve' : 'Biên lai nạp điện thoại Mauve',
        message: shareMessage,
      });
    } catch {
      // dismissed
    }
  };

  const handleResetForNew = () => {
    setStep('form');
    setPhone('');
    setSelectedCarrier(CARRIERS[0]);
    hasUserSelectedCarrierManually.current = false;
    setSelectedAmount(null);
    setSelectedPackage(null);
    setCompletedPayload(null);
  };

  // ── Scroll padding ───────────────────────────────────────────────────────
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.lg;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ════════════════════════════════════════════════════════════
          STEP 1 — FORM
      ════════════════════════════════════════════════════════════ */}
      {step === 'form' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}
        >
          <View style={styles.root}>
            {/* ── Standard Screen Header ── */}
            <ScreenHeader
              title={activeTab === 'data' ? 'Nạp Data' : 'Nạp điện thoại'}
              onBack={onClose}
              backLabel="Quay lại trang chủ"
            />

            {/* Segmented Tab Control: [ Nạp tiền ] [ Nạp Data ] */}
            <View style={styles.segmentWrapper}>
              <View style={styles.segmentContainer}>
                <Pressable
                  onPress={() => handleTabSwitch('topup')}
                  style={[
                    styles.segmentBtn,
                    activeTab === 'topup' && styles.segmentBtnActive,
                  ]}
                  accessibilityRole="tab"
                  accessibilityLabel="Nạp tiền điện thoại"
                  accessibilityState={{ selected: activeTab === 'topup' }}
                >
                  <Smartphone
                    size={16}
                    color={activeTab === 'topup' ? Palette.white : Palette.secondary}
                    strokeWidth={1.75}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      activeTab === 'topup' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Nạp tiền
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleTabSwitch('data')}
                  style={[
                    styles.segmentBtn,
                    activeTab === 'data' && styles.segmentBtnActive,
                  ]}
                  accessibilityRole="tab"
                  accessibilityLabel="Mua gói cước Data hoặc 5G"
                  accessibilityState={{ selected: activeTab === 'data' }}
                >
                  <Wifi
                    size={16}
                    color={activeTab === 'data' ? Palette.white : Palette.secondary}
                    strokeWidth={1.75}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      activeTab === 'data' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Nạp Data
                  </Text>
                  <View style={styles.tab5GBadge}>
                    <Text style={styles.tab5GBadgeText}>5G</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.flexOne}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Source Account */}
              <View style={styles.sectionBlock}>
                <SourceAccountSelector
                  account={currentAccount}
                  canSwitch={accounts.length > 1}
                  onPress={() => accounts.length > 1 && setIsAccountPickerOpen(true)}
                />
              </View>

              {/* Phone Number Card */}
              <GlassView variant="card" borderRadius={Radius.xl} style={styles.formCard}>
                <View style={styles.cardTitleRow}>
                  <Smartphone size={18} color={Palette.secondary} strokeWidth={1.75} />
                  <Text style={styles.cardHeaderTitleText}>Số điện thoại</Text>
                </View>

                {/* Recent Numbers */}
                {RECENT_NUMBERS.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.recentRow}
                    contentContainerStyle={styles.recentRowContent}
                  >
                    {RECENT_NUMBERS.map((r) => (
                      <Pressable
                        key={r.phone}
                        onPress={() => handleSelectRecent(r)}
                        style={({ pressed }) => [styles.recentPill, pressed && styles.btnPressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Chọn ${r.phone}`}
                      >
                        <Text style={styles.recentPillText}>{r.phone}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                {/* Phone Input */}
                <View style={[styles.inputBoxRow, !isPhoneValid && phone.length > 0 && styles.inputBoxError]}>
                  <Smartphone size={16} color={Palette.secondary} strokeWidth={1.75} />
                  <TextInput
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="rgba(193, 160, 172, 0.45)"
                    keyboardType="number-pad"
                    style={styles.textInputMain}
                    maxLength={13}
                    accessibilityLabel="Nhập số điện thoại cần nạp hoặc mua data"
                  />
                  {phone.length > 0 && (
                    <Pressable onPress={() => setPhone('')} hitSlop={8}>
                      <X size={16} color={Palette.secondary} strokeWidth={2} />
                    </Pressable>
                  )}
                </View>
                {phone.length > 0 && !isPhoneValid && (
                  <Text style={styles.errorText}>
                    Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 03–09)
                  </Text>
                )}
              </GlassView>

              {/* Carrier Selector Card */}
              <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, styles.formCardSpaced]}>
                <Text style={styles.cardHeaderTitle}>Chọn nhà mạng</Text>
                <View style={styles.carrierGrid}>
                  {CARRIERS.map((c) => {
                    const isActive = selectedCarrier.id === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => handleSelectCarrier(c)}
                        style={({ pressed }) => [
                          styles.carrierChip,
                          isActive && styles.carrierChipActive,
                          pressed && styles.btnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={c.name}
                        accessibilityState={{ selected: isActive }}
                      >
                        <View
                          style={[
                            styles.carrierDot,
                            { backgroundColor: c.color },
                            isActive && styles.carrierDotActive,
                          ]}
                        />
                        <Text
                          style={[
                            styles.carrierChipText,
                            isActive && styles.carrierChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                        {isActive && (
                          <CheckCircle2 size={14} color={Palette.light} strokeWidth={2.5} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </GlassView>

              {/* ── TAB CONTENT: NẠP TIỀN ── */}
              {activeTab === 'topup' && (
                <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, styles.formCardSpaced]}>
                  <Text style={styles.cardHeaderTitle}>Chọn mệnh giá nạp</Text>
                  <View style={styles.denomGrid}>
                    {DENOMINATIONS.map((val) => {
                      const isActive = selectedAmount === val;
                      const insufficient = val > currentAccount.balance;
                      return (
                        <Pressable
                          key={val}
                          onPress={() => !insufficient && setSelectedAmount(val)}
                          disabled={insufficient}
                          style={({ pressed }) => [
                            styles.denomCard,
                            isActive && styles.denomCardActive,
                            insufficient && styles.denomCardDisabled,
                            pressed && !insufficient && styles.btnPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`${formatVND(val)}${insufficient ? ', không đủ số dư' : ''}`}
                          accessibilityState={{ selected: isActive, disabled: insufficient }}
                        >
                          <Text
                            style={[
                              styles.denomValue,
                              isActive && styles.denomValueActive,
                              insufficient && styles.denomValueDisabled,
                            ]}
                          >
                            {val >= 1000000
                              ? `${val / 1000000}Tr`
                              : `${(val / 1000).toFixed(0)}K`}
                          </Text>
                          <Text
                            style={[
                              styles.denomLabel,
                              isActive && styles.denomLabelActive,
                              insufficient && styles.denomLabelDisabled,
                            ]}
                            numberOfLines={1}
                          >
                            {formatVND(val)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {selectedAmount !== null && selectedAmount > currentAccount.balance && (
                    <Text style={styles.errorText}>
                      Số dư khả dụng không đủ ({formatVND(currentAccount.balance)})
                    </Text>
                  )}

                  {/* Fee row */}
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Phí giao dịch:</Text>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Miễn phí</Text>
                    </View>
                  </View>
                </GlassView>
              )}

              {/* ── TAB CONTENT: NẠP DATA ── */}
              {activeTab === 'data' && (
                <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, styles.formCardSpaced]}>
                  <View style={styles.packageHeaderRow}>
                    <View style={styles.cardTitleRowNoMargin}>
                      <Wifi size={18} color={Palette.secondary} strokeWidth={1.75} />
                      <Text style={styles.cardHeaderTitleText}>Chọn gói cước Data / 5G</Text>
                    </View>
                    <View style={styles.carrierIndicatorBadge}>
                      <Text style={styles.carrierIndicatorText}>{selectedCarrier.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.catalogNoticeText}>
                    * Danh mục mô phỏng (DEMO) · Phù hợp thuê bao mạng {selectedCarrier.name}
                  </Text>

                  {availablePackages.length === 0 ? (
                    <View style={styles.emptyPackageState}>
                      <WifiOff size={28} color={Palette.secondary} strokeWidth={1.5} />
                      <Text style={styles.emptyPackageTitle}>Chưa có gói cước demo</Text>
                      <Text style={styles.emptyPackageSub}>
                        Hiện chưa có gói cước mô phỏng cho {selectedCarrier.name}. Vui lòng thử nhà mạng khác.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.packageList}>
                      {availablePackages.map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        const insufficient = pkg.price > currentAccount.balance;

                        return (
                          <Pressable
                            key={pkg.id}
                            onPress={() => !insufficient && setSelectedPackage(pkg)}
                            disabled={insufficient}
                            style={({ pressed }) => [
                              styles.packageCard,
                              isSelected && styles.packageCardActive,
                              insufficient && styles.packageCardDisabled,
                              pressed && !insufficient && styles.btnPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`${pkg.name}, ${pkg.dataAllowance}, ${pkg.validityDays} ngày, ${formatVND(pkg.price)}${insufficient ? ', không đủ số dư' : ''}`}
                            accessibilityState={{ selected: isSelected, disabled: insufficient }}
                          >
                            <View style={styles.packageCardHeader}>
                              <View style={styles.packageNameContainer}>
                                <Text
                                  style={[
                                    styles.packageName,
                                    isSelected && styles.packageNameActive,
                                    insufficient && styles.packageNameDisabled,
                                  ]}
                                >
                                  {pkg.name}
                                </Text>
                                {pkg.is5G ? (
                                  <View style={styles.pkg5GBadge}>
                                    <Zap size={10} color={Palette.incomeGreen} strokeWidth={2.5} />
                                    <Text style={styles.pkg5GBadgeText}>5G SIÊU TỐC</Text>
                                  </View>
                                ) : (
                                  <View style={styles.pkgDataBadge}>
                                    <Text style={styles.pkgDataBadgeText}>DATA</Text>
                                  </View>
                                )}
                              </View>

                              <View style={styles.packagePriceRight}>
                                <Text
                                  style={[
                                    styles.packagePrice,
                                    isSelected && styles.packagePriceActive,
                                    insufficient && styles.packagePriceDisabled,
                                  ]}
                                >
                                  {formatVND(pkg.price)}
                                </Text>
                                {isSelected && (
                                  <CheckCircle2 size={16} color={Palette.light} strokeWidth={2.5} style={{ alignSelf: 'flex-end', marginTop: 2 }} />
                                )}
                              </View>
                            </View>

                            <View style={styles.packageMetaRow}>
                              <View style={styles.allowancePill}>
                                <Text style={styles.allowancePillText}>{pkg.dataAllowance}</Text>
                              </View>
                              <Text style={styles.validityText}>Thời hạn {pkg.validityDays} ngày</Text>
                            </View>

                            <Text
                              style={[
                                styles.packageDescription,
                                insufficient && styles.packageDescriptionDisabled,
                              ]}
                              numberOfLines={2}
                            >
                              {pkg.description}
                            </Text>

                            {insufficient && (
                              <Text style={styles.insufficientBadge}>
                                Số dư không đủ ({formatVND(currentAccount.balance)})
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {selectedPackage !== null && selectedPackage.price > currentAccount.balance && (
                    <Text style={styles.errorText}>
                      Số dư khả dụng không đủ ({formatVND(currentAccount.balance)})
                    </Text>
                  )}

                  {/* Fee row */}
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Phí giao dịch:</Text>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Miễn phí</Text>
                    </View>
                  </View>
                </GlassView>
              )}

              {/* Primary Action Button (in ScrollView, not fixed) */}
              <View style={styles.scrollActionWrapper}>
                <LiquidGlassButton
                  title="Tiếp tục"
                  onPress={handleProceedToConfirmation}
                  disabled={!isFormValid}
                  accessibilityLabel="Tiếp tục đến bước xác nhận"
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 2 — CONFIRMATION
      ════════════════════════════════════════════════════════════ */}
      {step === 'confirmation' && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title={activeTab === 'data' ? 'Xác nhận mua gói cước' : 'Xác nhận nạp tiền'}
            onBack={() => setStep('form')}
            backLabel="Quay lại biểu mẫu"
          />

          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount hero */}
            <View style={styles.confirmAmountHero}>
              <Text style={styles.confirmAmountLabel}>
                {activeTab === 'data' ? 'TỔNG TIỀN THANH TOÁN' : 'SỐ TIỀN NẠP'}
              </Text>
              <Text style={styles.confirmAmountValue}>{formatVND(activeAmount)}</Text>
              <View style={styles.confirmFreeBadge}>
                <Text style={styles.confirmFreeBadgeText}>Miễn phí giao dịch</Text>
              </View>
            </View>

            {/* Summary card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
              <Text style={styles.cardHeaderTitle}>Chi tiết giao dịch</Text>

              {activeTab === 'data' && selectedPackage ? (
                <>
                  <SummaryRow label="Dịch vụ" value="Mua gói cước Data / 5G" valueBold />
                  <SummaryDivider />
                  <SummaryRow label="Gói cước" value={selectedPackage.name} valueBold>
                    <View style={styles.confirmPackageNameRow}>
                      <Text style={styles.summaryRowValueBold}>{selectedPackage.name}</Text>
                      {selectedPackage.is5G && (
                        <View style={styles.pkg5GBadgeSmall}>
                          <Text style={styles.pkg5GBadgeSmallText}>5G</Text>
                        </View>
                      )}
                    </View>
                  </SummaryRow>
                  <SummaryDivider />
                  <SummaryRow label="Dung lượng" value={selectedPackage.dataAllowance} valueBold />
                  <SummaryDivider />
                  <SummaryRow label="Thời hạn sử dụng" value={`${selectedPackage.validityDays} ngày`} valueBold />
                  <SummaryDivider />
                </>
              ) : null}

              <SummaryRow label="Số điện thoại" value={phone.trim()} valueBold />
              <SummaryDivider />
              <SummaryRow label="Nhà mạng" value={selectedCarrier.name} valueBold />
              <SummaryDivider />
              <SummaryRow label="Tài khoản trích tiền" value={currentAccount.accountName}>
                <Text style={styles.summaryRowValueSub}>
                  {maskAccountNumber(currentAccount.accountNumber)}
                </Text>
              </SummaryRow>
              <SummaryDivider />
              <SummaryRow label="Phí giao dịch">
                <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                  0 ₫ (Miễn phí)
                </Text>
              </SummaryRow>
              <SummaryDivider />
              <View style={[styles.summaryRow, { marginTop: Spacing.xs }]}>
                <Text style={styles.totalDebitLabel}>Tổng tiền thanh toán</Text>
                <Text style={styles.totalDebitValue}>{formatVND(activeAmount)}</Text>
              </View>
            </GlassView>

            {/* Actions */}
            <View style={styles.scrollActionWrapper}>
              <LiquidGlassButton
                title="Xác nhận &amp; Xác thực"
                onPress={handleProceedToOtp}
                icon={<ShieldCheck size={20} color={Palette.light} strokeWidth={2} />}
                iconPosition="left"
                accessibilityLabel="Xác nhận và Xác thực OTP"
              />
              <Pressable
                onPress={() => setStep('form')}
                style={({ pressed }) => [styles.secondaryGlassBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa thông tin"
              >
                <Text style={styles.secondaryGlassBtnText}>Chỉnh sửa thông tin</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 3 — OTP
      ════════════════════════════════════════════════════════════ */}
      {step === 'otp' && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Xác thực Smart OTP"
            onBack={() => setStep('confirmation')}
            backLabel="Quay lại xác nhận"
          />

          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.otpContainer}>
              <View style={styles.otpShieldCircle}>
                <ShieldCheck size={36} color={Palette.light} strokeWidth={1.75} />
              </View>

              <Text style={styles.otpHeading}>Nhập mã xác thực giao dịch</Text>
              {activeTab === 'data' && selectedPackage ? (
                <Text style={styles.otpSubheading}>
                  Mã bảo mật OTP gồm 6 số đã được kích hoạt cho giao dịch mua gói data{' '}
                  <Text style={{ color: Palette.light, fontWeight: '600' }}>
                    {selectedPackage.name} ({selectedPackage.dataAllowance})
                  </Text>{' '}
                  vào số{' '}
                  <Text style={{ color: Palette.light, fontWeight: '600' }}>{phone.trim()}</Text>.
                </Text>
              ) : (
                <Text style={styles.otpSubheading}>
                  Mã bảo mật OTP gồm 6 số đã được kích hoạt cho giao dịch nạp{' '}
                  <Text style={{ color: Palette.light, fontWeight: '600' }}>
                    {formatVND(selectedAmount ?? 0)}
                  </Text>{' '}
                  vào số{' '}
                  <Text style={{ color: Palette.light, fontWeight: '600' }}>{phone.trim()}</Text>.
                </Text>
              )}

              <View style={styles.demoBanner}>
                <Text style={styles.demoBannerText}>
                  ⚠️ Giao dịch mô phỏng (Demo) — Nhập mã OTP thử nghiệm:{' '}
                  <Text style={{ fontWeight: '700', color: Palette.light }}>123456</Text>
                </Text>
              </View>

              <View style={styles.otpInputsRow}>
                {otpDigits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(idx, val)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(idx, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[
                      styles.otpBox,
                      digit.length > 0 && styles.otpBoxFilled,
                      otpError.length > 0 && styles.otpBoxError,
                    ]}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {otpError.length > 0 && (
                <Text style={styles.otpErrorText}>{otpError}</Text>
              )}

              {isVerifyingOtp && (
                <View style={styles.verifyingRow}>
                  <ActivityIndicator size="small" color={Palette.light} />
                  <Text style={styles.verifyingText}>Đang xác thực giao dịch...</Text>
                </View>
              )}

              <View style={styles.otpResendSection}>
                {otpCountdown > 0 ? (
                  <Text style={styles.otpCountdownText}>Gửi lại mã OTP sau {otpCountdown}s</Text>
                ) : (
                  <Pressable
                    onPress={handleResendOtp}
                    style={styles.resendBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Gửi lại mã OTP"
                  >
                    <RefreshCw size={14} color={Palette.light} />
                    <Text style={styles.resendBtnText}>Gửi lại mã OTP mới</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.scrollActionWrapper}>
                <LiquidGlassButton
                  title={activeTab === 'data' ? 'Xác nhận đăng ký gói cước' : 'Xác nhận nạp tiền'}
                  onPress={() => verifyAndComplete(otpDigits.join(''))}
                  disabled={otpDigits.join('').length < 6 || isVerifyingOtp}
                  loading={isVerifyingOtp}
                  accessibilityLabel="Xác nhận OTP"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════
          STEP 4 — RESULT
      ════════════════════════════════════════════════════════════ */}
      {step === 'result' && completedPayload && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Biên lai giao dịch"
            rightElement={
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.navBarRightBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <X size={22} color={Palette.light} strokeWidth={1.75} />
              </Pressable>
            }
          />

          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Success hero */}
            <View style={styles.resultHero}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={36} color={Palette.incomeGreen} strokeWidth={2.2} />
              </View>
              <Text style={styles.resultHeading}>
                {completedPayload.serviceType === 'data'
                  ? 'Đăng ký gói cước thành công!'
                  : 'Nạp tiền thành công!'}
              </Text>
              <Text style={styles.resultAmount}>-{formatVND(completedPayload.amount)}</Text>
              <View style={styles.simulatedDemoBadge}>
                <Text style={styles.simulatedDemoBadgeText}>GIAO DỊCH MÔ PHỎNG (DEMO)</Text>
              </View>
            </View>

            {/* Receipt card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
              <SummaryRow label="Mã giao dịch">
                <Text style={[styles.summaryRowValueBold, { letterSpacing: 0.5 }]}>
                  {completedPayload.transactionCode}
                </Text>
              </SummaryRow>
              <SummaryDivider />
              <SummaryRow label="Thời gian" value={completedPayload.timestamp} valueBold />
              <SummaryDivider />

              {completedPayload.serviceType === 'data' && completedPayload.dataPackage ? (
                <>
                  <SummaryRow label="Dịch vụ" value="Mua gói cước Data / 5G" valueBold />
                  <SummaryDivider />
                  <SummaryRow label="Gói cước" value={completedPayload.dataPackage.name} valueBold />
                  <SummaryDivider />
                  <SummaryRow label="Dung lượng" value={completedPayload.dataPackage.dataAllowance} valueBold />
                  <SummaryDivider />
                  <SummaryRow label="Thời hạn" value={`${completedPayload.dataPackage.validityDays} ngày`} valueBold />
                  <SummaryDivider />
                </>
              ) : null}

              <SummaryRow label="Số điện thoại" value={completedPayload.phone} valueBold />
              <SummaryDivider />
              <SummaryRow label="Nhà mạng" value={completedPayload.carrier.name} valueBold />
              <SummaryDivider />
              <SummaryRow label="Tài khoản nguồn">
                <Text style={styles.summaryRowValueBold}>
                  {maskAccountNumber(currentAccount.accountNumber)}
                </Text>
              </SummaryRow>
              <SummaryDivider />
              <SummaryRow label="Phí giao dịch">
                <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                  0 ₫ (Miễn phí)
                </Text>
              </SummaryRow>
            </GlassView>

            {/* Actions */}
            <View style={styles.scrollActionWrapper}>
              <LiquidGlassButton
                title="Về trang chủ"
                onPress={onClose}
                accessibilityLabel="Về trang chủ"
              />
              <Pressable
                onPress={handleResetForNew}
                style={({ pressed }) => [styles.secondaryGlassBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={completedPayload.serviceType === 'data' ? 'Mua gói cước mới' : 'Nạp điện thoại mới'}
              >
                <Text style={styles.secondaryGlassBtnText}>
                  {completedPayload.serviceType === 'data' ? 'Mua gói cước khác' : 'Nạp điện thoại mới'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleShareReceipt}
                style={({ pressed }) => [styles.outlineGlassBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Chia sẻ biên lai"
              >
                <Share2 size={16} color={Palette.light} strokeWidth={1.75} />
                <Text style={styles.outlineGlassBtnText}>Chia sẻ biên lai</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL — Account Picker
      ════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAccountPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAccountPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsAccountPickerOpen(false)}>
          <View style={[styles.accountPickerSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.pickerDragHandle} />
            <Text style={styles.pickerTitle}>Chọn tài khoản nguồn</Text>
            {accounts.map((acc, idx) => {
              const isSelected = idx === selectedAccountIndex;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => { setSelectedAccountIndex(idx); setIsAccountPickerOpen(false); }}
                  style={({ pressed }) => [
                    styles.accountPickerItem,
                    isSelected && styles.accountPickerItemSelected,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={acc.accountName}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={styles.walletIconCircle}>
                      <Smartphone size={16} color={Palette.light} strokeWidth={1.75} />
                    </View>
                    <View style={styles.pickerItemMeta}>
                      <Text style={styles.pickerItemName}>{acc.accountName}</Text>
                      <Text style={styles.pickerItemNumber}>
                        {maskAccountNumber(acc.accountNumber)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pickerItemRight}>
                    <Text style={styles.pickerItemBalance}>{formatVND(acc.balance)}</Text>
                    {isSelected && (
                      <CheckCircle2 size={16} color={Palette.incomeGreen} strokeWidth={2.5} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Small helper sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface SummaryRowProps {
  label: string;
  value?: string;
  valueBold?: boolean;
  children?: React.ReactNode;
}
const SummaryRow: React.FC<SummaryRowProps> = ({ label, value, valueBold, children }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryRowLabel}>{label}</Text>
    <View style={styles.summaryRowValueCol}>
      {children ?? (
        <Text style={[styles.summaryRowValueBold, !valueBold && { fontWeight: '400' as const }]}>
          {value}
        </Text>
      )}
    </View>
  </View>
);

const SummaryDivider: React.FC = () => <View style={styles.summaryDivider} />;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  flexOne: { flex: 1 },
  btnPressed: { opacity: 0.75 },

  navBarRightBtn: {
    width: 44, height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },

  // ── Segmented Tab Control ──────────────────────
  segmentWrapper: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Palette.bg,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 24, 38, 0.70)',
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.16)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.28)',
  },
  segmentBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  segmentBtnTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  tab5GBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.18)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(50, 215, 75, 0.4)',
  },
  tab5GBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
  },

  // ── Scroll Content ────────────────────────────
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  sectionBlock: { marginBottom: Spacing.md },
  scrollActionWrapper: { marginTop: Spacing.xl, width: '100%' },

  // ── Form Cards ────────────────────────────────
  formCard: { padding: Spacing.lg },
  formCardSpaced: { marginTop: Spacing.md },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitleRowNoMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.tight,
  },
  cardHeaderTitleText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },

  // ── Recent Numbers ─────────────────────────────
  recentRow: { marginBottom: Spacing.md },
  recentRowContent: { gap: Spacing.sm, paddingVertical: Spacing.xxs },
  recentPill: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(48, 38, 56, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
  },
  recentPillText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // ── Phone Input ────────────────────────────────
  inputBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(22, 19, 31, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputBoxError: { borderColor: Palette.expenseRed },
  textInputMain: {
    flex: 1,
    color: Palette.white,
    fontSize: Typography.fontSize.subheadline,
  },
  errorText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.expenseRed,
    marginTop: Spacing.xs,
  },

  // ── Carrier Grid ───────────────────────────────
  carrierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  carrierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
    minWidth: '44%',
    flex: 1,
  },
  carrierChipActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderColor: Palette.light,
  },
  carrierDot: {
    width: 10, height: 10,
    borderRadius: 5,
    opacity: 0.80,
  },
  carrierDotActive: { opacity: 1 },
  carrierChipText: {
    flex: 1,
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  carrierChipTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  // ── Denomination Grid (Nạp tiền) ───────────────
  denomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  denomCard: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
    alignItems: 'center',
  },
  denomCardActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.40)',
    borderColor: Palette.light,
  },
  denomCardDisabled: { opacity: 0.40 },
  denomValue: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.secondary,
  },
  denomValueActive: { color: Palette.white },
  denomValueDisabled: { color: Palette.gray500 },
  denomLabel: {
    fontSize: 10,
    color: Palette.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  denomLabelActive: { color: Palette.light },
  denomLabelDisabled: { color: Palette.gray600 },

  // ── Data Packages UI (Nạp Data) ───────────
  packageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  carrierIndicatorBadge: {
    backgroundColor: 'rgba(193, 160, 172, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  carrierIndicatorText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },
  catalogNoticeText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginBottom: Spacing.md,
  },
  emptyPackageState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(22, 19, 31, 0.45)',
    borderRadius: Radius.md,
    marginVertical: Spacing.sm,
  },
  emptyPackageTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptyPackageSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  packageList: {
    gap: Spacing.sm,
  },
  packageCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.65)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.16)',
  },
  packageCardActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.32)',
    borderColor: Palette.light,
    borderWidth: 1.5,
  },
  packageCardDisabled: {
    opacity: 0.40,
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  packageNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  packageName: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  packageNameActive: {
    color: Palette.white,
  },
  packageNameDisabled: {
    color: Palette.gray500,
  },
  pkg5GBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(50, 215, 75, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(50, 215, 75, 0.35)',
  },
  pkg5GBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
    letterSpacing: 0.4,
  },
  pkg5GBadgeSmall: {
    backgroundColor: 'rgba(50, 215, 75, 0.16)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    marginLeft: 6,
  },
  pkg5GBadgeSmallText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
  },
  pkgDataBadge: {
    backgroundColor: 'rgba(193, 160, 172, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  pkgDataBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
  },
  packagePriceRight: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
  },
  packagePriceActive: {
    color: Palette.white,
  },
  packagePriceDisabled: {
    color: Palette.gray500,
  },
  packageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  allowancePill: {
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(240, 217, 228, 0.20)',
  },
  allowancePillText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  validityText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  packageDescription: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    lineHeight: 16,
  },
  packageDescriptionDisabled: {
    color: Palette.gray600,
  },
  insufficientBadge: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.expenseRed,
    marginTop: 4,
    fontWeight: Typography.fontWeight.medium,
  },

  // ── Fee Row ────────────────────────────────────
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(193, 160, 172, 0.12)',
  },
  feeLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  freeBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  freeBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.incomeGreen,
  },

  // ── Liquid Glass Button ────────────────────────
  glassBtnPressable: { height: 52, borderRadius: Radius.lg, overflow: 'hidden' },
  glassBtnPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  glassBtnContainer: { height: 52, width: '100%', justifyContent: 'center', alignItems: 'center' },
  glassBtnDisabled: { opacity: 0.65 },
  glassBtnContent: { width: '100%', height: 52, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg },
  glassBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    letterSpacing: 0.2,
  },
  glassBtnTextDisabled: { color: 'rgba(240, 217, 228, 0.40)' },
  btnInnerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnIconLeft: { marginRight: Spacing.sm },
  btnIconRight: { marginLeft: Spacing.sm },

  // ── Secondary / Outline Buttons ────────────────
  secondaryGlassBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(48, 38, 56, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.22)',
    marginTop: Spacing.md,
  },
  secondaryGlassBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
  outlineGlassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(30, 24, 38, 0.40)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    marginTop: Spacing.md,
  },
  outlineGlassBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },

  // ── Confirmation Amount Hero ───────────────────
  confirmAmountHero: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
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
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  confirmFreeBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.incomeGreen,
  },

  // ── Summary Card ───────────────────────────────
  summaryCard: { padding: Spacing.lg },
  confirmPackageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  summaryRowValueCol: { alignItems: 'flex-end', flex: 1.5 },
  summaryRowValueBold: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    textAlign: 'right',
  },
  summaryRowValueSub: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(193, 160, 172, 0.10)',
    marginVertical: Spacing.xs,
  },
  totalDebitLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  totalDebitValue: {
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
  },

  // ── OTP ────────────────────────────────────────
  otpContainer: { width: '100%', paddingTop: Spacing.md, alignItems: 'center' },
  otpShieldCircle: {
    width: 58, height: 58,
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
    width: 48, height: 56,
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
  otpBoxError: { borderColor: Palette.expenseRed },
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
  otpResendSection: { marginTop: Spacing.lg },
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

  // ── Result Hero ────────────────────────────────
  resultHero: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  successIconCircle: {
    width: 56, height: 56,
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

  // ── Account Picker Modal ───────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  accountPickerSheet: {
    backgroundColor: '#1E1826',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  pickerDragHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(193, 160, 172, 0.35)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  pickerTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: Spacing.md,
  },
  accountPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.10)',
  },
  accountPickerItemSelected: {
    backgroundColor: 'rgba(128, 108, 121, 0.20)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  pickerItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  walletIconCircle: {
    width: 34, height: 34,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  pickerItemMeta: { flex: 1 },
  pickerItemName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  pickerItemNumber: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: 2,
    letterSpacing: Typography.letterSpacing.wide,
  },
  pickerItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  pickerItemBalance: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
  },
});
