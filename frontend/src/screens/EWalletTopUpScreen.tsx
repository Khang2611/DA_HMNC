/**
 * EWalletTopUpScreen — Nạp tiền ví điện tử
 *
 * Full E-Wallet Top-Up module for Mauve Banking.
 * - Single continuous dark background (Palette.bg = '#16131F')
 * - Providers: MoMo, ZaloPay, ShopeePay
 * - Vietnamese phone number input with deterministic mock recipient lookup
 * - Recipient KYC / verification status card
 * - Clear "Không tìm thấy ví trong dữ liệu mô phỏng" message for unknown recipients
 * - Quick amount buttons and custom VND amount input (10.000 ₫ - 20.000.000 ₫)
 * - Source checking account selector with balance check
 * - Confirmation step with double-tap protection guard
 * - Success screen with formatted receipt, clipboard copy, and Share.share
 * - Primary action buttons inside ScrollView (never fixed/absolute bottom overlays)
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { Account } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatVND, maskAccountNumber, formatVNDInput, parseVNDInput } from '../utils/formatters';
import {
  WALLET_PROVIDERS,
  WalletProvider,
  WalletRecipient,
  WALLET_QUICK_AMOUNTS,
  MIN_TOPUP_AMOUNT,
  MAX_TOPUP_AMOUNT,
  normalizePhoneNumber,
  formatPhoneNumberDisplay,
  maskPhoneNumber,
  validateVietnamesePhone,
  findWalletRecipient,
  DEMO_PRESET_NUMBERS,
} from '../data/mockWallets';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EWalletStep = 'form' | 'confirmation' | 'result';

export interface EWalletPaymentPayload {
  sourceAccountId: string;
  provider: WalletProvider;
  recipient: WalletRecipient;
  amount: number;
  fee: number;
  referenceCode: string;
}

export interface EWalletTopUpScreenProps {
  visible?: boolean;
  accounts: Account[];
  initialAccountIndex?: number;
  onClose: () => void;
  onTopUpSuccess: (payload: EWalletPaymentPayload) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const EWalletTopUpScreen: React.FC<EWalletTopUpScreenProps> = ({
  visible,
  accounts,
  initialAccountIndex = 0,
  onClose,
  onTopUpSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.xxl;

  // Filter checking accounts eligible for top-up
  const checkingAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'checking'),
    [accounts]
  );

  // States
  const [step, setStep] = useState<EWalletStep>('form');
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider>(WALLET_PROVIDERS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Completed transaction data
  const [completedTx, setCompletedTx] = useState<{
    referenceCode: string;
    timestamp: string;
    provider: WalletProvider;
    recipient: WalletRecipient;
    amount: number;
    fee: number;
    sourceAccount: Account;
  } | null>(null);

  // Synchronous double-tap guard
  const isSubmittingRef = useRef(false);

  // Selected source account
  const currentAccount = checkingAccounts[selectedAccountIndex] || checkingAccounts[0] || accounts[0];

  // Reset form when reopened
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setStep('form');
      setSelectedProvider(WALLET_PROVIDERS[0]);
      setPhoneNumber('');
      setPhoneTouched(false);
      setAmountStr('');
      setIsSubmitting(false);
      setCompletedTx(null);
    }
  }

  useEffect(() => {
    if (visible) {
      isSubmittingRef.current = false;
    }
  }, [visible]);

  // Parse amount number
  const numericAmount = useMemo(() => {
    return parseVNDInput(amountStr);
  }, [amountStr]);

  // Recipient lookup
  const normalizedPhone = useMemo(() => normalizePhoneNumber(phoneNumber), [phoneNumber]);
  const phoneValidation = useMemo(
    () => validateVietnamesePhone(phoneNumber),
    [phoneNumber]
  );

  const matchedRecipient = useMemo(() => {
    if (!phoneValidation.isValid) return null;
    return findWalletRecipient(selectedProvider.id, normalizedPhone);
  }, [selectedProvider.id, normalizedPhone, phoneValidation.isValid]);

  const hasLookupError = useMemo(() => {
    return phoneValidation.isValid && !matchedRecipient;
  }, [phoneValidation.isValid, matchedRecipient]);

  // Amount validation
  const amountError = useMemo(() => {
    if (!numericAmount) return null;
    if (numericAmount < MIN_TOPUP_AMOUNT) {
      return `Số tiền nạp tối thiểu là ${formatVND(MIN_TOPUP_AMOUNT)}`;
    }
    if (numericAmount > MAX_TOPUP_AMOUNT) {
      return `Số tiền nạp tối đa là ${formatVND(MAX_TOPUP_AMOUNT)}`;
    }
    if (currentAccount && currentAccount.balance < numericAmount) {
      return `Số dư tài khoản không đủ (${formatVND(currentAccount.balance)} < ${formatVND(numericAmount)})`;
    }
    return null;
  }, [numericAmount, currentAccount]);

  // Can proceed to confirmation?
  const canProceed = useMemo(() => {
    if (!currentAccount) return false;
    if (!phoneValidation.isValid) return false;
    if (!matchedRecipient) return false;
    if (numericAmount < MIN_TOPUP_AMOUNT || numericAmount > MAX_TOPUP_AMOUNT) return false;
    if (currentAccount.balance < numericAmount) return false;
    if (isSubmitting) return false;
    return true;
  }, [currentAccount, phoneValidation.isValid, matchedRecipient, numericAmount, isSubmitting]);

  // Handle amount input change
  const handleAmountChange = (text: string) => {
    const formatted = formatVNDInput(text);
    setAmountStr(formatted);
  };

  // Handle quick amount selection
  const handleSelectQuickAmount = (amt: number) => {
    setAmountStr(formatVNDInput(amt));
  };

  // Quick preset phone selection
  const handleSelectPresetPhone = (rawPhone: string) => {
    setPhoneNumber(rawPhone);
    setPhoneTouched(true);
  };

  // Proceed to confirmation
  const handleGoToConfirmation = () => {
    if (!canProceed) return;
    setStep('confirmation');
  };

  // Execute payment
  const handleConfirmTopUp = useCallback(() => {
    if (isSubmittingRef.current || isSubmitting) return;
    if (!matchedRecipient || !currentAccount || numericAmount <= 0) return;
    if (currentAccount.balance < numericAmount) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const refCode = `WAL${Date.now().toString().slice(-8)}`;
    const fee = 0;

    // Simulate standard banking processing delay
    setTimeout(() => {
      const payload: EWalletPaymentPayload = {
        sourceAccountId: currentAccount.id,
        provider: selectedProvider,
        recipient: matchedRecipient,
        amount: numericAmount,
        fee,
        referenceCode: refCode,
      };

      onTopUpSuccess(payload);

      setCompletedTx({
        referenceCode: refCode,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        provider: selectedProvider,
        recipient: matchedRecipient,
        amount: numericAmount,
        fee,
        sourceAccount: currentAccount,
      });

      setIsSubmitting(false);
      isSubmittingRef.current = false;
      setStep('result');
    }, 700);
  }, [
    isSubmitting,
    matchedRecipient,
    currentAccount,
    numericAmount,
    selectedProvider,
    onTopUpSuccess,
  ]);

  // Copy reference code
  const handleCopyReference = async () => {
    if (!completedTx) return;
    await Clipboard.setStringAsync(completedTx.referenceCode);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Share text receipt
  const handleShareReceipt = async () => {
    if (!completedTx) return;
    const message = [
      '🏦 MAUVE BANKING — BIÊN NHẬN NẠP VÍ ĐIỆN TỬ (MÔ PHỎNG)',
      '──────────────────────────────',
      `Ví nhận: ${completedTx.provider.name}`,
      `Người nhận: ${completedTx.recipient.name}`,
      `Số điện thoại: ${maskPhoneNumber(completedTx.recipient.phone)}`,
      `Số tiền nạp: ${formatVND(completedTx.amount)}`,
      `Phí giao dịch: 0 ₫ (Miễn phí)`,
      `Tổng thanh toán: ${formatVND(completedTx.amount)}`,
      `Tài khoản nguồn: ${maskAccountNumber(completedTx.sourceAccount.accountNumber)}`,
      `Mã giao dịch: ${completedTx.referenceCode}`,
      `Thời gian: ${completedTx.timestamp}`,
      '──────────────────────────────',
      '⚠️ Giao dịch mô phỏng phục vụ mục đích kiểm thử ứng dụng.',
    ].join('\n');

    try {
      await Share.share({ message });
    } catch {
      // Ignored
    }
  };

  // Reset to form to top-up again
  const handleTopUpAgain = () => {
    setPhoneNumber('');
    setPhoneTouched(false);
    setAmountStr('');
    setCompletedTx(null);
    setStep('form');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Step 1: Input Form
  // ─────────────────────────────────────────────────────────────────────────
  const renderFormStep = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Simulation Info Badge */}
      <GlassView variant="subtle" borderRadius={Radius.md} style={styles.simNotice}>
        <ShieldCheck size={16} color={Palette.secondary} strokeWidth={2} />
        <Text style={styles.simNoticeText}>
          Dịch vụ nạp ví mô phỏng · Không trừ tiền thật và không chuyển vào ví thực tế.
        </Text>
      </GlassView>

      {/* Source Account Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Tài khoản nguồn</Text>
        <SourceAccountSelector
          account={currentAccount}
          canSwitch={checkingAccounts.length > 1}
          onPress={() => setIsAccountPickerOpen(true)}
        />
      </View>

      {/* Provider Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Chọn ví điện tử</Text>
        <View style={styles.providerGrid}>
          {WALLET_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider.id === provider.id;
            return (
              <Pressable
                key={provider.id}
                onPress={() => setSelectedProvider(provider)}
                style={({ pressed }) => [
                  styles.providerCardPressable,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={provider.name}
              >
                <GlassView
                  variant={isSelected ? 'card' : 'subtle'}
                  luminousBorder={isSelected}
                  borderRadius={Radius.lg}
                  style={[
                    styles.providerCard,
                    isSelected && { borderColor: provider.brandColor },
                  ]}
                >
                  <View
                    style={[
                      styles.providerBadge,
                      { backgroundColor: provider.brandColor },
                    ]}
                  >
                    <Text style={styles.providerBadgeText}>{provider.initials}</Text>
                  </View>
                  <Text
                    style={[
                      styles.providerName,
                      isSelected && styles.providerNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {provider.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.providerCheck}>
                      <Check size={12} color={Palette.white} strokeWidth={3} />
                    </View>
                  )}
                </GlassView>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Phone Number Input */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Số điện thoại ví nhận tiền</Text>
        <GlassView variant="card" borderRadius={Radius.lg} style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (!phoneTouched) setPhoneTouched(true);
            }}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={Palette.secondary}
            keyboardType="phone-pad"
            maxLength={13}
            accessibilityLabel="Số điện thoại ví nhận tiền"
          />
          {phoneNumber.length > 0 && (
            <Pressable
              onPress={() => setPhoneNumber('')}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <X size={16} color={Palette.secondary} />
            </Pressable>
          )}
        </GlassView>

        {/* Validation Error */}
        {phoneTouched && phoneNumber.length > 0 && !phoneValidation.isValid && (
          <View style={styles.inlineErrorRow}>
            <AlertCircle size={14} color={Palette.expenseRed} strokeWidth={2} />
            <Text style={styles.inlineErrorText}>{phoneValidation.error}</Text>
          </View>
        )}

        {/* Known Demo Recipient Status Card */}
        {matchedRecipient && (
          <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={styles.verifiedCard}>
            <View style={styles.verifiedHeader}>
              <View style={styles.verifiedCheckBadge}>
                <CheckCircle2 size={16} color={Palette.incomeGreen} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedName}>{matchedRecipient.name}</Text>
                <Text style={styles.verifiedPhone}>
                  {selectedProvider.name} · {maskPhoneNumber(matchedRecipient.phone)}
                </Text>
              </View>
            </View>
            <View style={styles.verifiedTagRow}>
              <View style={styles.verifiedTag}>
                <ShieldCheck size={12} color={Palette.incomeGreen} strokeWidth={2} />
                <Text style={styles.verifiedTagText}>{matchedRecipient.kycLevel}</Text>
              </View>
            </View>
          </GlassView>
        )}

        {/* Not Found In Mock Data Error */}
        {hasLookupError && (
          <View style={styles.notFoundBanner}>
            <AlertCircle size={18} color={Palette.expenseRed} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.notFoundTitle}>Không tìm thấy ví trong dữ liệu mô phỏng</Text>
              <Text style={styles.notFoundSub}>
                Số điện thoại {formatPhoneNumberDisplay(phoneNumber)} chưa liên kết {selectedProvider.name} trong hệ thống mô phỏng.
              </Text>
            </View>
          </View>
        )}

        {/* Quick Demo Suggestions */}
        <View style={styles.presetSection}>
          <Text style={styles.presetTitle}>Gợi ý số điện thoại ví mô phỏng:</Text>
          <View style={styles.presetChipWrap}>
            {DEMO_PRESET_NUMBERS.map((p) => (
              <Pressable
                key={p.rawPhone}
                onPress={() => handleSelectPresetPhone(p.rawPhone)}
                style={({ pressed }) => [
                  styles.presetChip,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.presetChipText}>{p.phone}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Số tiền nạp</Text>
        <GlassView variant="card" borderRadius={Radius.lg} style={styles.amountInputContainer}>
          <TextInput
            style={styles.amountTextInput}
            value={amountStr}
            onChangeText={handleAmountChange}
            placeholder="Nhập số tiền"
            placeholderTextColor={Palette.secondary}
            keyboardType="numeric"
            accessibilityLabel="Số tiền nạp"
          />
          <Text style={styles.amountCurrency}>₫</Text>
        </GlassView>

        {/* Quick Amount Chips */}
        <View style={styles.quickAmountRow}>
          {WALLET_QUICK_AMOUNTS.map((amt) => {
            const isSelected = numericAmount === amt;
            return (
              <Pressable
                key={amt}
                onPress={() => handleSelectQuickAmount(amt)}
                style={({ pressed }) => [
                  styles.quickAmountChip,
                  isSelected && styles.quickAmountChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    isSelected && styles.quickAmountTextActive,
                  ]}
                >
                  {formatVND(amt).replace(' ₫', 'đ')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount Error Banner */}
        {amountError && (
          <View style={styles.inlineErrorRow}>
            <AlertCircle size={14} color={Palette.expenseRed} strokeWidth={2} />
            <Text style={styles.inlineErrorText}>{amountError}</Text>
          </View>
        )}

        <Text style={styles.amountHint}>
          Tối thiểu: {formatVND(MIN_TOPUP_AMOUNT)} · Tối đa: {formatVND(MAX_TOPUP_AMOUNT)} / lần
        </Text>
      </View>

      {/* Fee Breakdown */}
      <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.feeCard}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Phí giao dịch</Text>
          <Text style={styles.feeValueFree}>Miễn phí (0 ₫)</Text>
        </View>
      </GlassView>

      {/* Action Button inside ScrollView */}
      <Pressable
        onPress={handleGoToConfirmation}
        disabled={!canProceed}
        style={({ pressed }) => [
          styles.primaryBtn,
          !canProceed && styles.btnDisabled,
          pressed && canProceed && styles.btnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Tiếp tục sang xác nhận"
      >
        <Text style={[styles.primaryBtnText, !canProceed && styles.btnTextDisabled]}>
          Tiếp tục
        </Text>
      </Pressable>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render Step 2: Confirmation Step
  // ─────────────────────────────────────────────────────────────────────────
  const renderConfirmationStep = () => {
    if (!matchedRecipient) return null;
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassView variant="subtle" borderRadius={Radius.md} style={styles.simNotice}>
          <ShieldCheck size={16} color={Palette.secondary} strokeWidth={2} />
          <Text style={styles.simNoticeText}>
            Kiểm tra thông tin giao dịch mô phỏng trước khi tiếp tục.
          </Text>
        </GlassView>

        <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.confirmCard}>
          <Text style={styles.confirmCardTitle}>Chi tiết nạp ví</Text>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Tài khoản nguồn</Text>
            <View style={styles.confirmValueCol}>
              <Text style={styles.confirmValueMain}>{currentAccount.accountName}</Text>
              <Text style={styles.confirmValueSub}>
                {maskAccountNumber(currentAccount.accountNumber)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Ví nhận tiền</Text>
            <View style={styles.confirmValueCol}>
              <View style={styles.providerInlineBadge}>
                <View style={[styles.miniCircle, { backgroundColor: selectedProvider.brandColor }]} />
                <Text style={styles.confirmValueMain}>{selectedProvider.name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Người nhận</Text>
            <Text style={styles.confirmValueMain}>{matchedRecipient.name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Số điện thoại ví</Text>
            <Text style={styles.confirmValueMain}>{maskPhoneNumber(matchedRecipient.phone)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Số tiền nạp</Text>
            <Text style={styles.confirmAmountValue}>{formatVND(numericAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Phí giao dịch</Text>
            <Text style={styles.feeValueFree}>Miễn phí (0 ₫)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmRowTotal}>
            <Text style={styles.confirmTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.confirmTotalValue}>{formatVND(numericAmount)}</Text>
          </View>
        </GlassView>

        {/* Action Buttons inside ScrollView */}
        <Pressable
          onPress={handleConfirmTopUp}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.primaryBtn,
            isSubmitting && styles.btnDisabled,
            pressed && !isSubmitting && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Xác nhận nạp ví"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Palette.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Xác nhận nạp ví</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setStep('form')}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryBtnText}>Thay đổi thông tin</Text>
        </Pressable>
      </ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Step 3: Success Screen
  // ─────────────────────────────────────────────────────────────────────────
  const renderResultStep = () => {
    if (!completedTx) return null;
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.resultHeader}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={48} color={Palette.incomeGreen} strokeWidth={2.2} />
          </View>
          <Text style={styles.resultTitle}>Nạp ví điện tử thành công</Text>
          <Text style={styles.resultAmount}>{formatVND(completedTx.amount)}</Text>
          <Text style={styles.resultTime}>{completedTx.timestamp}</Text>
        </View>

        {/* Receipt Details Card */}
        <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Mã giao dịch</Text>
            <View style={styles.referenceCopyRow}>
              <Text style={styles.receiptValueBold}>{completedTx.referenceCode}</Text>
              <Pressable
                onPress={handleCopyReference}
                hitSlop={8}
                style={styles.copyBtn}
              >
                <Copy size={14} color={copyFeedback ? Palette.incomeGreen : Palette.secondary} />
                {copyFeedback && <Text style={styles.copiedText}>Đã chép</Text>}
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Ví nhận</Text>
            <Text style={styles.receiptValue}>{completedTx.provider.name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Người nhận</Text>
            <Text style={styles.receiptValue}>{completedTx.recipient.name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Số điện thoại ví</Text>
            <Text style={styles.receiptValue}>{maskPhoneNumber(completedTx.recipient.phone)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Tài khoản nguồn</Text>
            <Text style={styles.receiptValue}>
              {maskAccountNumber(completedTx.sourceAccount.accountNumber)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Phí giao dịch</Text>
            <Text style={styles.feeValueFree}>Miễn phí (0 ₫)</Text>
          </View>
        </GlassView>

        {/* Demo Disclaimer Watermark */}
        <View style={styles.demoWatermark}>
          <ShieldCheck size={14} color={Palette.secondary} />
          <Text style={styles.demoWatermarkText}>
            Biên nhận mô phỏng — Không phải chứng từ chuyển tiền thật
          </Text>
        </View>

        {/* Action Buttons */}
        <Pressable
          onPress={handleShareReceipt}
          style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
        >
          <Share2 size={18} color={Palette.white} strokeWidth={2} />
          <Text style={styles.shareBtnText}>Chia sẻ biên nhận</Text>
        </Pressable>

        <Pressable
          onPress={handleTopUpAgain}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.primaryBtnText}>Nạp tiếp</Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryBtnText}>Về trang chủ</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader
        title={
          step === 'confirmation'
            ? 'Xác nhận nạp ví'
            : step === 'result'
            ? 'Kết quả giao dịch'
            : 'Nạp ví điện tử'
        }
        onBack={
          step === 'confirmation'
            ? () => setStep('form')
            : step === 'form'
            ? onClose
            : undefined
        }
        backLabel={step === 'confirmation' ? 'Quay lại' : 'Đóng'}
        rightElement={
          step === 'result' ? (
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.headerCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <X size={22} color={Palette.light} strokeWidth={1.75} />
            </Pressable>
          ) : undefined
        }
      />

      {/* Main Content by Step */}
      {step === 'form' && renderFormStep()}
      {step === 'confirmation' && renderConfirmationStep()}
      {step === 'result' && renderResultStep()}

      {/* Account Picker Modal */}
      <Modal
        visible={isAccountPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAccountPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsAccountPickerOpen(false)}
          />
          <View
            style={[
              styles.accountSheetContainer,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <GlassView
              variant="card"
              borderRadius={Radius.xxl}
              luminousBorder
              style={styles.sheetContent}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Chọn tài khoản nguồn</Text>
                <Pressable
                  onPress={() => setIsAccountPickerOpen(false)}
                  hitSlop={8}
                  style={styles.sheetCloseBtn}
                >
                  <X size={20} color={Palette.secondary} strokeWidth={1.75} />
                </Pressable>
              </View>

              <View style={styles.accountList}>
                {checkingAccounts.map((acc, idx) => {
                  const isSelected = idx === selectedAccountIndex;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => {
                        setSelectedAccountIndex(idx);
                        setIsAccountPickerOpen(false);
                      }}
                      style={[
                        styles.accountOptionRow,
                        isSelected && styles.accountOptionRowActive,
                      ]}
                    >
                      <View style={styles.accountOptionIcon}>
                        <Wallet size={18} color={Palette.light} strokeWidth={1.75} />
                      </View>
                      <View style={styles.accountOptionMeta}>
                        <Text style={styles.accountOptionTitle}>{acc.accountName}</Text>
                        <Text style={styles.accountOptionSub}>
                          {maskAccountNumber(acc.accountNumber)} · Số dư:{' '}
                          {formatVND(acc.balance)}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedCheck}>
                          <Check size={16} color={Palette.incomeGreen} strokeWidth={2.5} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </GlassView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  headerCloseBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  // Simulation notice
  simNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
  },
  simNoticeText: {
    flex: 1,
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    lineHeight: 16,
  },
  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.sm,
  },
  // Provider grid
  providerGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  providerCardPressable: {
    flex: 1,
  },
  providerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  providerBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  providerBadgeText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  providerName: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    textAlign: 'center',
  },
  providerNameSelected: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  providerCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Phone input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.callout,
    color: Palette.white,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  inlineErrorText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.expenseRed,
    flex: 1,
  },
  // Verified recipient card
  verifiedCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.3)',
    backgroundColor: 'rgba(50, 215, 75, 0.04)',
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verifiedCheckBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  verifiedPhone: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: 2,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
  },
  verifiedTagText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.incomeGreen,
    fontWeight: Typography.fontWeight.medium,
  },
  // Not found banner
  notFoundBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  notFoundTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.expenseRed,
  },
  notFoundSub: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  // Preset demo chips
  presetSection: {
    marginTop: Spacing.sm,
  },
  presetTitle: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
  },
  presetChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  presetChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.light,
  },
  // Amount input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  amountTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    paddingVertical: 0,
  },
  amountCurrency: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginLeft: Spacing.xs,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  quickAmountChip: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickAmountChipActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderColor: Palette.primary,
  },
  quickAmountText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  quickAmountTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  amountHint: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  // Fee card
  feeCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  feeValueFree: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.incomeGreen,
  },
  // Buttons
  primaryBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  primaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: Spacing.sm,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  shareBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnTextDisabled: {
    color: Palette.gray400,
  },
  btnPressed: {
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.75,
  },
  // Confirmation card
  confirmCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  confirmCardTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: Spacing.md,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  confirmRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  confirmLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  confirmValueCol: {
    alignItems: 'flex-end',
  },
  confirmValueMain: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  confirmValueSub: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
  },
  providerInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confirmAmountValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  confirmTotalLabel: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  confirmTotalValue: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  // Result screen
  resultHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.25)',
  },
  resultTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.xs,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginVertical: Spacing.xs,
  },
  resultTime: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  receiptCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  receiptLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  receiptValue: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  receiptValueBold: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  referenceCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  copiedText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.incomeGreen,
    fontWeight: Typography.fontWeight.medium,
  },
  demoWatermark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  demoWatermarkText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    fontStyle: 'italic',
  },
  // Modal Sheet
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  accountSheetContainer: {
    paddingHorizontal: Spacing.md,
  },
  sheetContent: {
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
  accountList: {
    gap: Spacing.sm,
  },
  accountOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  accountOptionRowActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderColor: Palette.primary,
  },
  accountOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(240, 217, 228, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accountOptionMeta: {
    flex: 1,
  },
  accountOptionTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  accountOptionSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: 2,
  },
  selectedCheck: {
    marginLeft: Spacing.sm,
  },
});
