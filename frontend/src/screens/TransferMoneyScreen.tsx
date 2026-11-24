import React, { useState, useEffect, useRef } from 'react';
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
  Building2,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Wallet,
  ArrowRight,
  Search,
  Check,
  RefreshCw,
} from 'lucide-react-native';

import { Account, Bank, SavedRecipient, TransferPayload } from '../types/banking';
import { VIETNAMESE_BANKS, SAVED_RECIPIENTS, lookupRecipientName } from '../data/mockRecipients';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber, formatVNDInput } from '../utils/formatters';
import { GlassView } from '../components/GlassView';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { ScreenHeader } from '../components/ScreenHeader';

export interface TransferMoneyScreenProps {
  accounts: Account[];
  initialAccountIndex?: number;
  onClose: () => void;
  onTransferSuccess?: (payload: TransferPayload) => void;
}

type TransferStep = 'form' | 'confirmation' | 'otp' | 'result';

const QUICK_AMOUNTS = [100000, 500000, 1000000, 2000000, 5000000];

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

/**
 * Liquid Glass Primary Button
 * Reuses the project's native GlassView implementation (BlurView with dimezisBlurViewSdk31Plus on Android),
 * delicate SVG specular highlight border, and rich mauve brand tint.
 */
const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  style,
  accessibilityLabel,
}) => {
  return (
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
        style={[
          styles.glassBtnContainer,
          disabled && styles.glassBtnDisabled,
        ]}
      >
        {/* Mauve Brand Primary Tint Layer */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: disabled
                ? 'rgba(48, 38, 56, 0.40)'
                : 'rgba(128, 108, 121, 0.35)',
              borderRadius: Radius.lg,
            },
          ]}
        />

        <View style={styles.glassBtnContent}>
          {loading ? (
            <ActivityIndicator size="small" color={Palette.light} />
          ) : (
            <View style={styles.buttonInnerContent}>
              {iconPosition === 'left' && icon && <View style={styles.buttonIconLeft}>{icon}</View>}
              <Text
                style={[
                  styles.glassBtnText,
                  disabled && styles.glassBtnTextDisabled,
                ]}
              >
                {title}
              </Text>
              {iconPosition === 'right' && icon && <View style={styles.buttonIconRight}>{icon}</View>}
            </View>
          )}
        </View>
      </GlassView>
    </Pressable>
  );
};

export const TransferMoneyScreen: React.FC<TransferMoneyScreenProps> = ({
  accounts,
  initialAccountIndex = 0,
  onClose,
  onTransferSuccess,
}) => {
  const insets = useSafeAreaInsets();

  // Current multi-step state
  const [step, setStep] = useState<TransferStep>('form');

  // Step 1: Form state
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);
  const [selectedBank, setSelectedBank] = useState<Bank>(VIETNAMESE_BANKS[1]); // Techcombank default
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isLookingUpName, setIsLookingUpName] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [description, setDescription] = useState('Quy Nguyen chuyen tien');

  // Modals for selection
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);

  // Step 3: OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const otpInputRefs = useRef<(TextInputInstance | null)[]>([]);

  // Step 4: Transfer result state
  const [completedTransfer, setCompletedTransfer] = useState<TransferPayload | null>(null);

  const currentSourceAccount = accounts[selectedAccountIndex] || accounts[0];

  // OTP Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  // Handle Account number input & Napas 247 auto lookup
  const handleAccountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setRecipientAccount(cleaned);

    if (cleaned.length >= 6) {
      setIsLookingUpName(true);
      setTimeout(() => {
        const found = lookupRecipientName(selectedBank.id, cleaned);
        setRecipientName(found);
        setIsLookingUpName(false);
      }, 350);
    } else {
      setRecipientName('');
      setIsLookingUpName(false);
    }
  };

  // Select a saved recipient chip
  const handleSelectSavedRecipient = (rec: SavedRecipient) => {
    const bank = VIETNAMESE_BANKS.find((b) => b.id === rec.bankId) || VIETNAMESE_BANKS[0];
    setSelectedBank(bank);
    setRecipientAccount(rec.accountNumber);
    setRecipientName(rec.name);
  };

  // Amount input handler with VND formatting
  const handleAmountChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    const num = parseInt(numericOnly, 10) || 0;
    setRawAmount(num);
    if (num > 0) {
      setAmountInput(formatVNDInput(num));
    } else {
      setAmountInput('');
    }
  };

  const handleQuickAmount = (val: number) => {
    setRawAmount(val);
    setAmountInput(formatVNDInput(val));
  };

  // Validation
  const isAmountValid = rawAmount >= 10000 && rawAmount <= currentSourceAccount.balance;
  const isFormValid =
    recipientAccount.length >= 6 &&
    recipientName.trim().length > 0 &&
    isAmountValid &&
    description.trim().length > 0;

  // Proceed from Form to Confirmation
  const handleProceedToConfirmation = () => {
    if (!isFormValid) return;
    setStep('confirmation');
  };

  // Proceed from Confirmation to OTP
  const handleProceedToOtp = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpCountdown(60);
    setStep('otp');
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 200);
  };

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    setOtpError('');
    const cleanChar = value.replace(/[^0-9]/g, '').slice(-1);

    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    // Auto focus next input
    if (cleanChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    const completeCode = newDigits.join('');
    if (completeCode.length === 6) {
      verifyAndCompleteTransfer(completeCode);
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpCountdown(60);
    otpInputRefs.current[0]?.focus();
  };

  // Verify simulated OTP & complete transaction
  const verifyAndCompleteTransfer = (code: string) => {
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      // Accept demo OTP '123456' or any 6-digit for demo convenience
      if (code === '123456' || code.length === 6) {
        const timestamp = new Date();
        const formattedDate = `${timestamp.toLocaleDateString('vi-VN')} ${timestamp.toLocaleTimeString('vi-VN')}`;
        const txCode = `FT${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

        const payload: TransferPayload = {
          sourceAccountId: currentSourceAccount.id,
          recipientBank: selectedBank,
          recipientAccountNumber: recipientAccount,
          recipientName: recipientName.toUpperCase(),
          amount: rawAmount,
          description: description.trim(),
          fee: 0,
          transactionCode: txCode,
          timestamp: formattedDate,
        };

        setCompletedTransfer(payload);
        onTransferSuccess?.(payload);
        setStep('result');
      } else {
        setOtpError('Mã OTP không chính xác. Vui lòng nhập 123456 để thử nghiệm.');
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    }, 600);
  };

  // Share digital receipt
  const handleShareReceipt = async () => {
    if (!completedTransfer) return;
    try {
      await Share.share({
        title: 'Biên lai chuyển tiền Mauve',
        message: `[MAUVE DIGITAL BANKING - BIÊN LAI CHUYỂN TIỀN]
Trạng thái: Chuyển tiền thành công (Mô phỏng)
Số tiền: ${formatVND(completedTransfer.amount)}
Người nhận: ${completedTransfer.recipientName}
Ngân hàng: ${completedTransfer.recipientBank.shortName}
Số tài khoản nhận: ${completedTransfer.recipientAccountNumber}
Tài khoản nguồn: ${currentSourceAccount.accountName} (${maskAccountNumber(currentSourceAccount.accountNumber)})
Nội dung: ${completedTransfer.description}
Mã giao dịch: ${completedTransfer.transactionCode}
Thời gian: ${completedTransfer.timestamp}
Phí giao dịch: Miễn phí (0 ₫)
Cảm ơn quý khách đã sử dụng dịch vụ của Mauve Banking.`,
      });
    } catch {
      // share dismissed
    }
  };

  // Reset form for a new transfer
  const handleResetForNewTransfer = () => {
    setStep('form');
    setRecipientAccount('');
    setRecipientName('');
    setAmountInput('');
    setRawAmount(0);
    setDescription('Quy Nguyen chuyen tien');
    setCompletedTransfer(null);
  };

  // Filtered banks for picker modal
  const filteredBanks = VIETNAMESE_BANKS.filter(
    (b) =>
      b.shortName.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ──────────────────────────────────────────────────────────
          STEP 1: TRANSFER FORM
      ────────────────────────────────────────────────────────── */}
      {step === 'form' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}
        >
          <View style={styles.root}>
            {/* ── Standard Screen Header ── */}
            <ScreenHeader
              title="Chuyển tiền"
              onBack={onClose}
              backLabel="Quay lại Trang chủ"
            />

            {/* Scrollable Form Content */}
            <ScrollView
              style={styles.flexOne}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Compact Redesigned Source Account Selector Card */}
              <View style={styles.sectionBlock}>
                <SourceAccountSelector
                  account={currentSourceAccount}
                  canSwitch={accounts.length > 1}
                  onPress={() => accounts.length > 1 && setIsAccountPickerOpen(true)}
                />
              </View>

              {/* Recent Recipients Carousel */}
              <View style={styles.recentsSection}>
                <Text style={styles.sectionSubLabel}>NGƯỜI NHẬN GẦN ĐÂY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentsScroll}>
                  {SAVED_RECIPIENTS.map((rec) => (
                    <Pressable
                      key={rec.id}
                      onPress={() => handleSelectSavedRecipient(rec)}
                      style={({ pressed }) => [styles.recentRecipientPill, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn ${rec.name}`}
                    >
                      <View style={styles.recentAvatar}>
                        <Text style={styles.recentAvatarText}>{rec.avatarInitial}</Text>
                      </View>
                      <View style={styles.recentMeta}>
                        <Text style={styles.recentName} numberOfLines={1}>
                          {rec.name}
                        </Text>
                        <Text style={styles.recentBank}>{rec.bankShortName}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Recipient Information Card */}
              <GlassView variant="card" borderRadius={Radius.xl} style={styles.formCard}>
                <Text style={styles.cardHeaderTitle}>Thông tin người nhận</Text>

                {/* Bank Selector Row */}
                <Text style={styles.inputFieldLabel}>Ngân hàng thụ hưởng</Text>
                <Pressable
                  onPress={() => setIsBankPickerOpen(true)}
                  style={({ pressed }) => [styles.bankSelectorBtn, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Chọn ngân hàng"
                >
                  <View style={styles.bankSelectorLeft}>
                    <View style={styles.bankIconCircle}>
                      <Building2 size={18} color={Palette.light} strokeWidth={1.75} />
                    </View>
                    <View style={styles.bankSelectorInfo}>
                      <Text style={styles.bankSelectedName}>{selectedBank.shortName}</Text>
                      <Text style={styles.bankSelectedFullName} numberOfLines={1}>
                        {selectedBank.name}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={18} color={Palette.secondary} />
                </Pressable>

                {/* Account Number Input */}
                <Text style={[styles.inputFieldLabel, { marginTop: Spacing.md }]}>
                  Số tài khoản nhận
                </Text>
                <View style={styles.inputBoxRow}>
                  <TextInput
                    value={recipientAccount}
                    onChangeText={handleAccountChange}
                    placeholder="Nhập số tài khoản"
                    placeholderTextColor="rgba(193, 160, 172, 0.45)"
                    keyboardType="number-pad"
                    style={styles.textInputMain}
                  />
                  {recipientAccount.length > 0 && (
                    <Pressable
                      onPress={() => {
                        setRecipientAccount('');
                        setRecipientName('');
                      }}
                      hitSlop={8}
                    >
                      <X size={16} color={Palette.secondary} />
                    </Pressable>
                  )}
                </View>

                {/* Recipient Verified Name Banner */}
                {isLookingUpName && (
                  <View style={styles.lookingUpRow}>
                    <ActivityIndicator size="small" color={Palette.light} />
                    <Text style={styles.lookingUpText}>Đang tra cứu tên chủ tài khoản...</Text>
                  </View>
                )}

                {recipientName.length > 0 && !isLookingUpName && (
                  <View style={styles.verifiedNameBox}>
                    <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={2} />
                    <View style={styles.verifiedMeta}>
                      <Text style={styles.verifiedTitle}>TÊN NGƯỜI THỤ HƯỞNG (NAPAS 247)</Text>
                      <Text style={styles.verifiedName}>{recipientName}</Text>
                    </View>
                  </View>
                )}
              </GlassView>

              {/* Transfer Details Card */}
              <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
                <Text style={styles.cardHeaderTitle}>Chi tiết chuyển tiền</Text>

                {/* Amount Input */}
                <Text style={styles.inputFieldLabel}>Số tiền chuyển</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    value={amountInput}
                    onChangeText={handleAmountChange}
                    placeholder="Nhập số tiền"
                    placeholderTextColor="rgba(193, 160, 172, 0.45)"
                    keyboardType="numeric"
                    style={styles.amountTextInput}
                  />
                  <Text style={styles.amountCurrencySuffix}>VND</Text>
                </View>

                {/* Amount Validation Feedback */}
                {rawAmount > currentSourceAccount.balance && (
                  <Text style={styles.errorText}>
                    Số dư khả dụng không đủ ({formatVND(currentSourceAccount.balance)})
                  </Text>
                )}
                {rawAmount > 0 && rawAmount < 10000 && (
                  <Text style={styles.warningText}>Số tiền chuyển tối thiểu là 10.000 ₫</Text>
                )}

                {/* Quick Amount Chips */}
                <View style={styles.quickAmountsRow}>
                  {QUICK_AMOUNTS.map((val) => (
                    <Pressable
                      key={val}
                      onPress={() => handleQuickAmount(val)}
                      style={({ pressed }) => [
                        styles.quickAmountChip,
                        rawAmount === val && styles.quickAmountChipActive,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          rawAmount === val && styles.quickAmountTextActive,
                        ]}
                      >
                        {val >= 1000000 ? `${val / 1000000}Tr` : `${val / 1000}K`}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => handleQuickAmount(currentSourceAccount.balance)}
                    style={styles.quickAmountChip}
                  >
                    <Text style={styles.quickAmountText}>Tất cả</Text>
                  </Pressable>
                </View>

                {/* Description Input */}
                <Text style={[styles.inputFieldLabel, { marginTop: Spacing.md }]}>
                  Nội dung chuyển tiền
                </Text>
                <View style={styles.inputBoxRow}>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Nhập nội dung chuyển tiền"
                    placeholderTextColor="rgba(193, 160, 172, 0.45)"
                    maxLength={70}
                    style={styles.textInputMain}
                  />
                </View>
                <Text style={styles.charCountText}>{description.length}/70</Text>

                {/* Fee Info Badge */}
                <View style={styles.feeInfoRow}>
                  <Text style={styles.feeInfoLabel}>Phí giao dịch:</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Miễn phí (Napas 247)</Text>
                  </View>
                </View>
              </GlassView>

              {/* Primary Action Button at end of scrollable content */}
              <View style={styles.scrollActionWrapper}>
                <LiquidGlassButton
                  title="Tiếp tục"
                  onPress={handleProceedToConfirmation}
                  disabled={!isFormValid}
                  icon={
                    <ArrowRight
                      size={18}
                      color={
                        isFormValid
                          ? Palette.light
                          : 'rgba(240, 217, 228, 0.40)'
                      }
                    />
                  }
                  iconPosition="right"
                  accessibilityLabel="Tiếp tục đến bước xác nhận"
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ──────────────────────────────────────────────────────────
          STEP 2: TRANSFER CONFIRMATION
      ────────────────────────────────────────────────────────── */}
      {step === 'confirmation' && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Xác nhận chuyển tiền"
            onBack={() => setStep('form')}
            backLabel="Quay lại biểu mẫu"
          />

          {/* Scrollable Confirmation Content */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount Hero directly on continuous Palette.bg */}
            <View style={styles.confirmAmountHero}>
              <Text style={styles.confirmAmountLabel}>SỐ TIỀN CHUYỂN</Text>
              <Text style={styles.confirmAmountValue}>{formatVND(rawAmount)}</Text>
              <View style={styles.confirmFreeBadge}>
                <Text style={styles.confirmFreeBadgeText}>Miễn phí chuyển tiền Napas 247</Text>
              </View>
            </View>

            {/* Details Summary Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
              <Text style={styles.cardHeaderTitle}>Chi tiết giao dịch</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Tài khoản trích tiền</Text>
                <View style={styles.summaryRowValueCol}>
                  <Text style={styles.summaryRowValueBold}>{currentSourceAccount.accountName}</Text>
                  <Text style={styles.summaryRowValueSub}>
                    {maskAccountNumber(currentSourceAccount.accountNumber)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Người nhận</Text>
                <View style={styles.summaryRowValueCol}>
                  <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                    {recipientName.toUpperCase()}
                  </Text>
                  <Text style={styles.summaryRowValueSub}>{recipientAccount}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Ngân hàng nhận</Text>
                <View style={styles.summaryRowValueCol}>
                  <Text style={styles.summaryRowValueBold}>{selectedBank.shortName}</Text>
                  <Text style={styles.summaryRowValueSub} numberOfLines={1}>
                    {selectedBank.name}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Phương thức</Text>
                <Text style={styles.summaryRowValueBold}>Chuyển nhanh Napas 247</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Nội dung</Text>
                <Text style={[styles.summaryRowValueBold, { flex: 1, textAlign: 'right' }]}>
                  {description}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Phí giao dịch</Text>
                <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                  0 ₫ (Miễn phí)
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={[styles.summaryRow, { marginTop: Spacing.xs }]}>
                <Text style={styles.totalDebitLabel}>Tổng tiền thanh toán</Text>
                <Text style={styles.totalDebitValue}>{formatVND(rawAmount)}</Text>
              </View>
            </GlassView>

            {/* Confirmation Action Buttons inside ScrollView at the end */}
            <View style={styles.scrollActionWrapper}>
              <LiquidGlassButton
                title="Xác nhận &amp; Xác thực"
                onPress={handleProceedToOtp}
                icon={<ShieldCheck size={20} color={Palette.light} strokeWidth={2} />}
                iconPosition="left"
                accessibilityLabel="Xác nhận & Xác thực OTP"
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

      {/* ──────────────────────────────────────────────────────────
          STEP 3: SIMULATED OTP AUTHENTICATION
      ────────────────────────────────────────────────────────── */}
      {step === 'otp' && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Xác thực Smart OTP"
            onBack={() => setStep('confirmation')}
            backLabel="Quay lại xác nhận"
          />

          {/* Scrollable OTP Content */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.otpContainer}>
              <View style={styles.otpShieldCircle}>
                <ShieldCheck size={36} color={Palette.light} strokeWidth={1.75} />
              </View>

              <Text style={styles.otpHeading}>Nhập mã xác thực giao dịch</Text>
              <Text style={styles.otpSubheading}>
                Mã bảo mật OTP gồm 6 số đã được kích hoạt cho giao dịch chuyển {formatVND(rawAmount)} đến{' '}
                <Text style={{ color: Palette.light, fontWeight: '600' }}>{recipientName}</Text>.
              </Text>

              {/* Demo Helper Banner */}
              <View style={styles.demoBanner}>
                <Text style={styles.demoBannerText}>
                  ⚠️ Giao dịch mô phỏng (Demo) — Nhập mã OTP thử nghiệm:{' '}
                  <Text style={{ fontWeight: '700', color: Palette.light }}>123456</Text>
                </Text>
              </View>

              {/* 6 Digit Input Boxes */}
              <View style={styles.otpInputsRow}>
                {otpDigits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
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

              {otpError.length > 0 && <Text style={styles.otpErrorText}>{otpError}</Text>}

              {isVerifyingOtp && (
                <View style={styles.verifyingRow}>
                  <ActivityIndicator size="small" color={Palette.light} />
                  <Text style={styles.verifyingText}>Đang xác thực giao dịch...</Text>
                </View>
              )}

              {/* Countdown / Resend */}
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

              {/* Action Button inside ScrollView at the end */}
              <View style={styles.scrollActionWrapper}>
                <LiquidGlassButton
                  title="Xác nhận chuyển khoản"
                  onPress={() => verifyAndCompleteTransfer(otpDigits.join(''))}
                  disabled={otpDigits.join('').length < 6 || isVerifyingOtp}
                  loading={isVerifyingOtp}
                  accessibilityLabel="Xác nhận OTP"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────
          STEP 4: TRANSFER RESULT (RECEIPT)
      ────────────────────────────────────────────────────────── */}
      {step === 'result' && completedTransfer && (
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

          {/* Scrollable Receipt Content */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Success Status Hero directly on continuous Palette.bg */}
            <View style={styles.resultHero}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={36} color={Palette.incomeGreen} strokeWidth={2.2} />
              </View>
              <Text style={styles.resultHeading}>Chuyển tiền thành công!</Text>
              <Text style={styles.resultAmount}>-{formatVND(completedTransfer.amount)}</Text>
              <View style={styles.simulatedDemoBadge}>
                <Text style={styles.simulatedDemoBadgeText}>GIAO DỊCH MÔ PHỎNG (DEMO)</Text>
              </View>
            </View>

            {/* Detailed Receipt Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Mã giao dịch</Text>
                <Text style={[styles.summaryRowValueBold, { letterSpacing: 0.5 }]}>
                  {completedTransfer.transactionCode}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Thời gian</Text>
                <Text style={styles.summaryRowValueBold}>{completedTransfer.timestamp}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Người nhận</Text>
                <View style={styles.summaryRowValueCol}>
                  <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                    {completedTransfer.recipientName}
                  </Text>
                  <Text style={styles.summaryRowValueSub}>
                    {completedTransfer.recipientAccountNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Ngân hàng nhận</Text>
                <Text style={styles.summaryRowValueBold}>
                  {completedTransfer.recipientBank.shortName}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Tài khoản nguồn</Text>
                <Text style={styles.summaryRowValueBold}>
                  {maskAccountNumber(currentSourceAccount.accountNumber)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Nội dung</Text>
                <Text style={[styles.summaryRowValueBold, { flex: 1, textAlign: 'right' }]}>
                  {completedTransfer.description}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Phí giao dịch</Text>
                <Text style={[styles.summaryRowValueBold, { color: Palette.incomeGreen }]}>
                  0 ₫ (Miễn phí)
                </Text>
              </View>
            </GlassView>

            {/* Action Buttons inside ScrollView at the end */}
            <View style={styles.scrollActionWrapper}>
              <LiquidGlassButton
                title="Về trang chủ"
                onPress={onClose}
                accessibilityLabel="Về trang chủ"
              />

              <Pressable
                onPress={handleResetForNewTransfer}
                style={({ pressed }) => [styles.secondaryGlassBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Thực hiện chuyển tiền mới"
              >
                <Text style={styles.secondaryGlassBtnText}>Chuyển tiền mới</Text>
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

      {/* ──────────────────────────────────────────────────────────
          MODAL: BANK PICKER
      ────────────────────────────────────────────────────────── */}
      <Modal
        visible={isBankPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsBankPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.sm }]}>
            <Text style={styles.modalTitle}>Chọn ngân hàng thụ hưởng</Text>
            <Pressable
              onPress={() => setIsBankPickerOpen(false)}
              hitSlop={12}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={Palette.light} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Search size={18} color={Palette.secondary} />
            <TextInput
              value={bankSearchQuery}
              onChangeText={setBankSearchQuery}
              placeholder="Nhập từ khóa tìm kiếm"
              placeholderTextColor="rgba(193, 160, 172, 0.45)"
              style={styles.searchInput}
            />
            {bankSearchQuery.length > 0 && (
              <Pressable onPress={() => setBankSearchQuery('')}>
                <X size={16} color={Palette.secondary} />
              </Pressable>
            )}
          </View>

          {/* Bank List */}
          <ScrollView contentContainerStyle={styles.bankListScroll}>
            {filteredBanks.map((bank) => {
              const isSelected = bank.id === selectedBank.id;
              return (
                <Pressable
                  key={bank.id}
                  onPress={() => {
                    setSelectedBank(bank);
                    setIsBankPickerOpen(false);
                    // Re-trigger name lookup if account already has digits
                    if (recipientAccount.length >= 6) {
                      setRecipientName(lookupRecipientName(bank.id, recipientAccount));
                    }
                  }}
                  style={({ pressed }) => [
                    styles.bankListItem,
                    isSelected && styles.bankListItemSelected,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.bankListItemIconCircle}>
                    <Building2 size={20} color={Palette.light} strokeWidth={1.75} />
                  </View>
                  <View style={styles.bankListItemMeta}>
                    <Text style={styles.bankListItemShortName}>{bank.shortName}</Text>
                    <Text style={styles.bankListItemFullName} numberOfLines={1}>
                      {bank.name}
                    </Text>
                  </View>
                  {isSelected && <Check size={18} color={Palette.light} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ──────────────────────────────────────────────────────────
          MODAL: SOURCE ACCOUNT PICKER
      ────────────────────────────────────────────────────────── */}
      <Modal
        visible={isAccountPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAccountPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsAccountPickerOpen(false)}>
          <View style={[styles.accountPickerSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.pickerDragHandle} />
            <Text style={styles.modalTitle}>Chọn tài khoản nguồn</Text>
            {accounts.map((acc, idx) => {
              const isSelected = idx === selectedAccountIndex;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => {
                    setSelectedAccountIndex(idx);
                    setIsAccountPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.accountPickerItem,
                    isSelected && styles.accountPickerItemSelected,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.sourceCardLeft}>
                    <View style={styles.walletIconCircle}>
                      <Wallet size={18} color={Palette.light} />
                    </View>
                    <View style={styles.sourceMeta}>
                      <Text style={styles.sourceAccountName}>{acc.accountName}</Text>
                      <Text style={styles.sourceAccountNumber}>{maskAccountNumber(acc.accountNumber)}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.sourceBalanceValue}>{formatVND(acc.balance)}</Text>
                    {isSelected && <Check size={16} color={Palette.incomeGreen} strokeWidth={2.5} />}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg, // Back in Black #16131F
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  sectionBlock: {
    marginBottom: Spacing.md,
  },
  scrollActionWrapper: {
    marginTop: Spacing.xl,
    width: '100%',
  },
  btnPressed: {
    opacity: 0.75,
  },

  navBarRightBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },

  // ── Source Account Modal Picker Items ────────
  sourceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sourceMeta: {
    flex: 1,
  },
  sourceAccountName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  sourceAccountNumber: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: 2,
    letterSpacing: Typography.letterSpacing.wide,
  },
  sourceBalanceValue: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    marginTop: 1,
  },
  recentsSection: {
    marginBottom: Spacing.md,
  },
  sectionSubLabel: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
  },
  recentsScroll: {
    flexDirection: 'row',
    paddingVertical: Spacing.xxs,
  },
  recentRecipientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(48, 38, 56, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  recentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  recentAvatarText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  recentMeta: {},
  recentName: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    maxWidth: 110,
  },
  recentBank: {
    fontSize: 10,
    color: Palette.secondary,
  },

  // ── Form Cards ───────────────────────────────
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
  inputFieldLabel: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
  },
  bankSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(22, 19, 31, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bankSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  bankSelectorInfo: {
    flex: 1,
  },
  bankSelectedName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  bankSelectedFullName: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 1,
  },
  inputBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 19, 31, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  textInputMain: {
    flex: 1,
    color: Palette.white,
    fontSize: Typography.fontSize.subheadline,
  },
  lookingUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  lookingUpText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginLeft: Spacing.sm,
  },
  verifiedNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.30)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  verifiedMeta: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
    letterSpacing: Typography.letterSpacing.wider,
  },
  verifiedName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginTop: 1,
  },

  // ── Amount Input ─────────────────────────────
  amountInputContainer: {
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
  amountCurrencySuffix: {
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
  warningText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.warning,
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
  charCountText: {
    fontSize: 10,
    color: Palette.secondary,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  feeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(193, 160, 172, 0.12)',
  },
  feeInfoLabel: {
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

  // ── Liquid Glass Action Buttons ──────────────
  glassBtnPressable: {
    height: 52,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  glassBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  glassBtnContainer: {
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnDisabled: {
    opacity: 0.65,
  },
  glassBtnContent: {
    width: '100%',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  glassBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    letterSpacing: 0.2,
  },
  glassBtnTextDisabled: {
    color: 'rgba(240, 217, 228, 0.40)',
  },
  buttonInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconLeft: {
    marginRight: Spacing.sm,
  },
  buttonIconRight: {
    marginLeft: Spacing.sm,
  },
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

  // ── Confirmation Screen Styles ───────────────
  confirmAmountHero: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
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

  // ── OTP Screen Styles ────────────────────────
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

  // ── Result Screen Styles ─────────────────────
  resultHero: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
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

  // ── Modal Styles ─────────────────────────────
  modalRoot: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.15)',
  },
  modalTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(48, 38, 56, 0.65)',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Palette.white,
    fontSize: Typography.fontSize.subheadline,
    marginLeft: Spacing.sm,
  },
  bankListScroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  bankListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.10)',
  },
  bankListItemSelected: {
    backgroundColor: 'rgba(128, 108, 121, 0.20)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  bankListItemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  bankListItemMeta: {
    flex: 1,
  },
  bankListItemShortName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  bankListItemFullName: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
  },

  // ── Source Account Picker Sheet ──────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(193, 160, 172, 0.35)',
    alignSelf: 'center',
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
});
