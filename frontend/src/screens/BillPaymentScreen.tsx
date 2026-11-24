/**
 * BillPaymentScreen — Thanh toán hóa đơn
 *
 * Full Bill Payment module for Mauve Banking.
 * - Single continuous dark background (Palette.bg = '#16131F')
 * - Categories: Tiền điện, Tiền nước, Internet, Truyền hình, Di động trả sau
 * - Inline live search (instant diacritic-insensitive filtering)
 * - Provider selection
 * - Deterministic customer code lookup with async simulation
 * - Bill details & checking account selector (SourceAccountSelector)
 * - Balance validation (prevents negative balance)
 * - Duplicate payment prevention (blocked if already paid)
 * - Confirmation step (no fake OTP)
 * - Payment success screen with text-based receipt sharing
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Share,
  Keyboard,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  Building2,
  Wallet,
  Check,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { Account } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { ScreenHeader } from '../components/ScreenHeader';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { formatVND, maskAccountNumber } from '../utils/formatters';
import { removeVietnameseDiacritics } from '../utils/transactionHistory';
import {
  BILL_SERVICES,
  BILL_PROVIDERS,
  BillService,
  BillProvider,
  BillInvoice,
  lookupMockInvoice,
} from '../data/mockBills';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BillStep =
  | 'categories'
  | 'providers'
  | 'lookup'
  | 'details'
  | 'confirmation'
  | 'result';

export interface BillPaymentSuccessPayload {
  invoiceId: string;
  sourceAccountId: string;
  amount: number;
  providerName: string;
  serviceTitle: string;
  customerName: string;
  customerCode: string;
  billingPeriod: string;
  referenceCode: string;
}

export interface BillPaymentScreenProps {
  visible?: boolean;
  accounts: Account[];
  invoices: BillInvoice[];
  initialAccountIndex?: number;
  onClose: () => void;
  onPaymentSuccess: (payload: BillPaymentSuccessPayload) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const BillPaymentScreen: React.FC<BillPaymentScreenProps> = ({
  visible,
  accounts,
  invoices,
  initialAccountIndex = 0,
  onClose,
  onPaymentSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.xl;

  // Filter checking accounts eligible for bill payment
  const checkingAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'checking'),
    [accounts]
  );

  // Flow States
  const [step, setStep] = useState<BillStep>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<BillService | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null);
  const [customerCode, setCustomerCode] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<BillInvoice | null>(null);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [completedTx, setCompletedTx] = useState<{
    referenceCode: string;
    timestamp: string;
    invoice: BillInvoice;
    provider: BillProvider;
    service: BillService;
    account: Account;
  } | null>(null);

  // Selected payment account
  const currentAccount = checkingAccounts[selectedAccountIndex] || checkingAccounts[0] || accounts[0];

  // Reset state whenever screen is reopened (even if mounted while hidden)
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setStep('categories');
      setSearchQuery('');
      setSelectedService(null);
      setSelectedProvider(null);
      setCustomerCode('');
      setLookupError(null);
      setCurrentInvoice(null);
      setCompletedTx(null);
      setIsSubmittingPayment(false);
    }
  }

  // ── Inline Live Search ─────────────────────────────────────────────────────
  // Matches service title/subtitle OR provider name/shortName
  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return {
        matchedServices: BILL_SERVICES,
        matchedProviders: [] as BillProvider[],
      };
    }

    const normQuery = removeVietnameseDiacritics(trimmed);

    // 1. Matched providers
    const providers = BILL_PROVIDERS.filter((p) => {
      const matchName = removeVietnameseDiacritics(p.name).includes(normQuery);
      const matchShort = removeVietnameseDiacritics(p.shortName).includes(normQuery);
      return matchName || matchShort;
    });

    // 2. Matched service categories (either directly by title, or having matching providers)
    const matchedCategoryIds = new Set(providers.map((p) => p.categoryId));
    const services = BILL_SERVICES.filter((s) => {
      const matchTitle = removeVietnameseDiacritics(s.title).includes(normQuery);
      const matchSub = removeVietnameseDiacritics(s.subtitle).includes(normQuery);
      return matchTitle || matchSub || matchedCategoryIds.has(s.id);
    });

    return {
      matchedServices: services,
      matchedProviders: providers,
    };
  }, [searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectService = (service: BillService) => {
    setSelectedService(service);
    setSearchQuery('');
    setStep('providers');
  };

  const handleSelectProvider = (provider: BillProvider) => {
    setSelectedProvider(provider);
    const service = BILL_SERVICES.find((s) => s.id === provider.categoryId) || BILL_SERVICES[0];
    setSelectedService(service);
    setCustomerCode('');
    setLookupError(null);
    setCurrentInvoice(null);
    setStep('lookup');
  };

  const handleLookupBill = () => {
    if (!selectedProvider) return;
    const cleanCode = customerCode.trim();
    if (!cleanCode) {
      setLookupError('Vui lòng nhập mã khách hàng / mã hợp đồng.');
      return;
    }

    Keyboard.dismiss();
    setIsSearchingCustomer(true);
    setLookupError(null);

    // Simulated asynchronous lookup (500ms) with deterministic lookup in shared invoices
    setTimeout(() => {
      setIsSearchingCustomer(false);
      const found = lookupMockInvoice(invoices, selectedProvider.id, cleanCode);

      if (!found) {
        setLookupError(
          `Không tìm thấy hóa đơn cần thanh toán cho mã "${cleanCode}". Vui lòng kiểm tra lại mã khách hàng hoặc nhà cung cấp.`
        );
        setCurrentInvoice(null);
        return;
      }

      if (found.status === 'paid') {
        setCurrentInvoice(found);
        setLookupError(
          `Hóa đơn ${found.billingPeriod} đã được thanh toán${
            found.paidAt ? ` vào ngày ${found.paidAt}` : ''
          }. Quý khách không cần thanh toán lại.`
        );
        return;
      }

      // Valid unpaid invoice found
      setCurrentInvoice(found);
      setLookupError(null);
      setStep('details');
    }, 500);
  };

  const handleProceedToConfirmation = () => {
    if (!currentInvoice) return;
    if (currentAccount.balance < currentInvoice.amountDue) {
      setLookupError('Số dư tài khoản nguồn không đủ để thanh toán hóa đơn này.');
      return;
    }
    setStep('confirmation');
  };

  const handleExecutePayment = () => {
    if (!currentInvoice || !selectedProvider || !selectedService || isSubmittingPayment) {
      return;
    }

    if (currentAccount.balance < currentInvoice.amountDue) {
      setStep('details');
      setLookupError('Số dư tài khoản nguồn không đủ để thanh toán hóa đơn.');
      return;
    }

    setIsSubmittingPayment(true);

    const refCode = `BILL${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedTimestamp = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} - ${String(
      now.getDate()
    ).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    // Execute atomic payment via parent callback
    onPaymentSuccess({
      invoiceId: currentInvoice.id,
      sourceAccountId: currentAccount.id,
      amount: currentInvoice.amountDue,
      providerName: selectedProvider.name,
      serviceTitle: selectedService.title,
      customerName: currentInvoice.customerName,
      customerCode: currentInvoice.customerCode,
      billingPeriod: currentInvoice.billingPeriod,
      referenceCode: refCode,
    });

    setCompletedTx({
      referenceCode: refCode,
      timestamp: formattedTimestamp,
      invoice: currentInvoice,
      provider: selectedProvider,
      service: selectedService,
      account: currentAccount,
    });

    setIsSubmittingPayment(false);
    setStep('result');
  };

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
    } catch {
      await Share.share({ message: code });
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }, []);

  const handleShareReceipt = async () => {
    if (!completedTx) return;
    try {
      const { referenceCode, timestamp, invoice, provider, service, account } = completedTx;
      let text = `MAUVE BANKING — BIÊN LAI THANH TOÁN HÓA ĐƠN\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `Mã giao dịch: ${referenceCode}\n`;
      text += `Dịch vụ: ${service.title}\n`;
      text += `Nhà cung cấp: ${provider.name}\n`;
      text += `Khách hàng: ${invoice.customerName}\n`;
      text += `Mã khách hàng: ${invoice.customerCode}\n`;
      text += `Kỳ thanh toán: ${invoice.billingPeriod}\n`;
      text += `Số tiền: ${formatVND(invoice.amountDue)}\n`;
      text += `Phí dịch vụ: Miễn phí\n`;
      text += `Tài khoản nguồn: ${maskAccountNumber(account.accountNumber)}\n`;
      text += `Thời gian: ${timestamp}\n`;
      text += `Trạng thái: Thành công\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `Mauve Banking — Ngân hàng số tối giản`;
      await Share.share({ message: text });
    } catch {
      // User cancelled
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'categories':
        onClose();
        break;
      case 'providers':
        setStep('categories');
        break;
      case 'lookup':
        setStep('providers');
        setLookupError(null);
        break;
      case 'details':
        setStep('lookup');
        setLookupError(null);
        break;
      case 'confirmation':
        setStep('details');
        break;
      case 'result':
        onClose();
        break;
    }
  };

  const handleRestart = () => {
    setStep('categories');
    setSearchQuery('');
    setSelectedService(null);
    setSelectedProvider(null);
    setCustomerCode('');
    setLookupError(null);
    setCurrentInvoice(null);
    setCompletedTx(null);
  };

  // Title for Navigation Header
  const navTitle = useMemo(() => {
    switch (step) {
      case 'categories':
        return 'Thanh toán hóa đơn';
      case 'providers':
        return selectedService?.title || 'Chọn nhà cung cấp';
      case 'lookup':
        return 'Nhập thông tin hóa đơn';
      case 'details':
        return 'Chi tiết hóa đơn';
      case 'confirmation':
        return 'Xác nhận thanh toán';
      case 'result':
        return 'Kết quả giao dịch';
    }
  }, [step, selectedService]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader title={navTitle} onBack={handleBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: CATEGORIES & INLINE LIVE SEARCH                              */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 'categories' && (
          <View>
            {/* Inline live search bar */}
            <View style={styles.searchBarWrapper}>
              <Search size={18} color={Palette.secondary} strokeWidth={1.75} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nhập từ khóa tìm kiếm"
                placeholderTextColor={Palette.gray500}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                  style={styles.searchClearBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Xóa tìm kiếm"
                >
                  <X size={16} color={Palette.light} strokeWidth={2} />
                </Pressable>
              )}
            </View>

            {/* Empty state when no service or provider matches */}
            {searchResults.matchedServices.length === 0 && searchResults.matchedProviders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Search size={32} color={Palette.secondary} strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>Không tìm thấy dịch vụ phù hợp</Text>
                <Text style={styles.emptySubtitle}>Thử tìm kiếm bằng từ khóa khác.</Text>
              </View>
            ) : (
              <>
                {/* When searching and specific providers match, show matched providers directly */}
                {searchQuery.trim().length > 0 && searchResults.matchedProviders.length > 0 && (
                  <View style={styles.sectionWrapper}>
                    <Text style={styles.sectionHeading}>Nhà cung cấp phù hợp</Text>
                    <GlassView variant="card" borderRadius={Radius.xl} style={styles.cardGroup}>
                      {searchResults.matchedProviders.map((provider, idx) => {
                        const isLast = idx === searchResults.matchedProviders.length - 1;
                        return (
                          <Pressable
                            key={provider.id}
                            onPress={() => handleSelectProvider(provider)}
                            style={({ pressed }) => [
                              styles.listRow,
                              !isLast && styles.listRowBorder,
                              pressed && styles.listRowPressed,
                            ]}
                          >
                            <View style={styles.rowIconBox}>
                              <Building2 size={20} color={Palette.light} strokeWidth={1.75} />
                            </View>
                            <View style={styles.rowMeta}>
                              <Text style={styles.rowTitle}>{provider.name}</Text>
                              <Text style={styles.rowSubtitle}>{provider.codeLabel}</Text>
                            </View>
                            <ChevronRight size={18} color={Palette.secondary} strokeWidth={2} />
                          </Pressable>
                        );
                      })}
                    </GlassView>
                  </View>
                )}

                {/* Service Categories Grid */}
                <View style={styles.sectionWrapper}>
                  <Text style={styles.sectionHeading}>
                    {searchQuery.trim().length > 0 ? 'Dịch vụ phù hợp' : 'Chọn loại hóa đơn'}
                  </Text>
                  <GlassView variant="card" borderRadius={Radius.xl} style={styles.cardGroup}>
                    {searchResults.matchedServices.map((service, index) => {
                      const { Icon } = service;
                      const isLast = index === searchResults.matchedServices.length - 1;
                      return (
                        <Pressable
                          key={service.id}
                          onPress={() => handleSelectService(service)}
                          style={({ pressed }) => [
                            styles.listRow,
                            !isLast && styles.listRowBorder,
                            pressed && styles.listRowPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={service.title}
                        >
                          <View style={styles.rowIconBox}>
                            <Icon size={20} color={Palette.light} strokeWidth={1.75} />
                          </View>
                          <View style={styles.rowMeta}>
                            <Text style={styles.rowTitle}>{service.title}</Text>
                            <Text style={styles.rowSubtitle}>{service.subtitle}</Text>
                          </View>
                          <ChevronRight size={18} color={Palette.secondary} strokeWidth={2} />
                        </Pressable>
                      );
                    })}
                  </GlassView>
                </View>
              </>
            )}
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: PROVIDER SELECTION                                           */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 'providers' && selectedService && (
          <View>
            <View style={styles.stepIntro}>
              <Text style={styles.stepIntroTitle}>Chọn nhà cung cấp dịch vụ</Text>
              <Text style={styles.stepIntroSubtitle}>
                Dịch vụ: {selectedService.title} ({selectedService.subtitle})
              </Text>
            </View>

            <GlassView variant="card" borderRadius={Radius.xl} style={styles.cardGroup}>
              {BILL_PROVIDERS.filter((p) => p.categoryId === selectedService.id).map(
                (provider, index, arr) => {
                  const isLast = index === arr.length - 1;
                  return (
                    <Pressable
                      key={provider.id}
                      onPress={() => handleSelectProvider(provider)}
                      style={({ pressed }) => [
                        styles.listRow,
                        !isLast && styles.listRowBorder,
                        pressed && styles.listRowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={provider.name}
                    >
                      <View style={styles.rowIconBox}>
                        <Building2 size={20} color={Palette.light} strokeWidth={1.75} />
                      </View>
                      <View style={styles.rowMeta}>
                        <Text style={styles.rowTitle}>{provider.name}</Text>
                        <Text style={styles.rowSubtitle}>{provider.codeLabel}</Text>
                      </View>
                      <ChevronRight size={18} color={Palette.secondary} strokeWidth={2} />
                    </Pressable>
                  );
                }
              )}
            </GlassView>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: CUSTOMER LOOKUP                                              */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 'lookup' && selectedProvider && (
          <View>
            {/* Selected provider badge */}
            <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.providerBadgeCard}>
              <View style={styles.providerBadgeIcon}>
                <Building2 size={20} color={Palette.light} strokeWidth={1.75} />
              </View>
              <View style={styles.providerBadgeInfo}>
                <Text style={styles.providerBadgeName}>{selectedProvider.name}</Text>
                <Text style={styles.providerBadgeCategory}>
                  {selectedService?.title} · {selectedProvider.shortName}
                </Text>
              </View>
              <Pressable
                onPress={() => setStep('providers')}
                hitSlop={8}
                style={styles.changeProviderBtn}
              >
                <Text style={styles.changeProviderText}>Đổi</Text>
              </Pressable>
            </GlassView>

            {/* Input Form */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{selectedProvider.codeLabel}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={customerCode}
                  onChangeText={(val) => {
                    setCustomerCode(val);
                    setLookupError(null);
                  }}
                  placeholder={selectedProvider.codePlaceholder}
                  placeholderTextColor={Palette.gray500}
                  style={styles.textInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleLookupBill}
                />
                {customerCode.length > 0 && (
                  <Pressable
                    onPress={() => setCustomerCode('')}
                    hitSlop={8}
                    style={styles.clearInputBtn}
                  >
                    <X size={16} color={Palette.light} strokeWidth={2} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.inputHelperText}>{selectedProvider.codeHelper}</Text>
            </View>

            {/* Sample Test Codes for Easy Verification */}
            <View style={styles.sampleCodesSection}>
              <Text style={styles.sampleCodesTitle}>Mã thử nghiệm mẫu:</Text>
              <View style={styles.sampleCodesChips}>
                {selectedProvider.categoryId === 'electric' && (
                  <>
                    <Pressable
                      onPress={() => setCustomerCode('PE010008899')}
                      style={styles.sampleChip}
                    >
                      <Text style={styles.sampleChipText}>PE010008899 (Chưa trả)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setCustomerCode('PE010001234')}
                      style={styles.sampleChip}
                    >
                      <Text style={styles.sampleChipText}>PE010001234 (Đã thanh toán)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setCustomerCode('PE029999999')}
                      style={styles.sampleChip}
                    >
                      <Text style={styles.sampleChipText}>PE029999999 (Số tiền lớn)</Text>
                    </Pressable>
                  </>
                )}
                {selectedProvider.categoryId === 'water' && (
                  <Pressable
                    onPress={() => setCustomerCode('SW998877')}
                    style={styles.sampleChip}
                  >
                    <Text style={styles.sampleChipText}>SW998877 (285.000 ₫)</Text>
                  </Pressable>
                )}
                {selectedProvider.categoryId === 'internet' && (
                  <Pressable
                    onPress={() => setCustomerCode('SGN882910')}
                    style={styles.sampleChip}
                  >
                    <Text style={styles.sampleChipText}>SGN882910 (330.000 ₫)</Text>
                  </Pressable>
                )}
                {selectedProvider.categoryId === 'tv' && (
                  <Pressable
                    onPress={() => setCustomerCode('KP112233')}
                    style={styles.sampleChip}
                  >
                    <Text style={styles.sampleChipText}>KP112233 (175.000 ₫)</Text>
                  </Pressable>
                )}
                {selectedProvider.categoryId === 'postpaid' && (
                  <Pressable
                    onPress={() => setCustomerCode('0988776655')}
                    style={styles.sampleChip}
                  >
                    <Text style={styles.sampleChipText}>0988776655 (450.000 ₫)</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Error or Notice Banner */}
            {lookupError && (
              <View
                style={[
                  styles.noticeBanner,
                  currentInvoice?.status === 'paid'
                    ? styles.noticeBannerWarning
                    : styles.noticeBannerError,
                ]}
              >
                <AlertCircle
                  size={18}
                  color={
                    currentInvoice?.status === 'paid' ? Palette.warning : Palette.expenseRed
                  }
                  strokeWidth={2}
                />
                <Text style={styles.noticeBannerText}>{lookupError}</Text>
              </View>
            )}

            {/* Lookup Button */}
            <Pressable
              onPress={handleLookupBill}
              disabled={isSearchingCustomer || customerCode.trim().length === 0}
              style={({ pressed }) => [
                styles.primaryBtn,
                (isSearchingCustomer || customerCode.trim().length === 0) && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tra cứu hóa đơn"
            >
              <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={styles.primaryBtnInner}>
                {isSearchingCustomer ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Tra cứu hóa đơn</Text>
                )}
              </GlassView>
            </Pressable>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 4: BILL DETAILS & SOURCE ACCOUNT                                */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 'details' && currentInvoice && selectedProvider && (
          <View>
            {/* Invoice Details Card */}
            <Text style={styles.sectionHeading}>Thông tin hóa đơn</Text>
            <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Khách hàng</Text>
                <Text style={styles.detailValueBold}>{currentInvoice.customerName}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã khách hàng</Text>
                <Text style={styles.detailValue}>{currentInvoice.customerCode}</Text>
              </View>

              {currentInvoice.customerAddress && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Địa chỉ / Gói</Text>
                    <Text style={[styles.detailValue, { maxWidth: '60%' }]} numberOfLines={2}>
                      {currentInvoice.customerAddress}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nhà cung cấp</Text>
                <Text style={styles.detailValue}>{selectedProvider.name}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kỳ hóa đơn</Text>
                <Text style={styles.detailValue}>{currentInvoice.billingPeriod}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hạn thanh toán</Text>
                <Text style={styles.detailValue}>{currentInvoice.dueDate}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tiền hóa đơn</Text>
                <Text style={styles.detailValue}>{formatVND(currentInvoice.amountDue)}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí giao dịch</Text>
                <Text style={[styles.detailValue, { color: Palette.incomeGreen }]}>Miễn phí</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={[styles.detailRow, { paddingTop: Spacing.sm }]}>
                <Text style={styles.totalRowLabel}>Tổng thanh toán</Text>
                <Text style={styles.totalRowValue}>{formatVND(currentInvoice.amountDue)}</Text>
              </View>
            </GlassView>

            {/* Source Account Selector */}
            <Text style={[styles.sectionHeading, { marginTop: Spacing.xl }]}>
              Tài khoản thanh toán
            </Text>
            <SourceAccountSelector
              account={currentAccount}
              canSwitch={checkingAccounts.length > 1}
              onPress={() => setIsAccountPickerOpen(true)}
            />

            {/* Insufficient balance error banner */}
            {currentAccount.balance < currentInvoice.amountDue && (
              <View style={[styles.noticeBanner, styles.noticeBannerError, { marginTop: Spacing.md }]}>
                <AlertCircle size={18} color={Palette.expenseRed} strokeWidth={2} />
                <Text style={styles.noticeBannerText}>
                  Số dư tài khoản nguồn không đủ để thanh toán (Số dư:{' '}
                  {formatVND(currentAccount.balance)} &lt; Cần:{' '}
                  {formatVND(currentInvoice.amountDue)}).
                </Text>
              </View>
            )}

            {/* Proceed to Confirmation Button */}
            <Pressable
              onPress={handleProceedToConfirmation}
              disabled={currentAccount.balance < currentInvoice.amountDue}
              style={({ pressed }) => [
                styles.primaryBtn,
                currentAccount.balance < currentInvoice.amountDue && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tiếp tục"
            >
              <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={styles.primaryBtnInner}>
                <Text style={styles.primaryBtnText}>Tiếp tục</Text>
              </GlassView>
            </Pressable>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 5: PAYMENT CONFIRMATION                                         */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 'confirmation' && currentInvoice && selectedProvider && (
          <View>
            <Text style={styles.stepIntroTitle}>Xác nhận thanh toán hóa đơn</Text>
            <Text style={styles.stepIntroSubtitle}>
              Vui lòng kiểm tra kỹ thông tin trước khi thực hiện thanh toán.
            </Text>

            <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dịch vụ</Text>
                <Text style={styles.detailValueBold}>{selectedService?.title}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nhà cung cấp</Text>
                <Text style={styles.detailValue}>{selectedProvider.name}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Khách hàng</Text>
                <Text style={styles.detailValueBold}>{currentInvoice.customerName}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã khách hàng</Text>
                <Text style={styles.detailValue}>{currentInvoice.customerCode}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kỳ hóa đơn</Text>
                <Text style={styles.detailValue}>{currentInvoice.billingPeriod}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tài khoản nguồn</Text>
                <Text style={styles.detailValue}>
                  {currentAccount.accountName} ({maskAccountNumber(currentAccount.accountNumber)})
                </Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tiền hóa đơn</Text>
                <Text style={styles.detailValue}>{formatVND(currentInvoice.amountDue)}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí giao dịch</Text>
                <Text style={[styles.detailValue, { color: Palette.incomeGreen }]}>Miễn phí</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={[styles.detailRow, { paddingTop: Spacing.sm }]}>
                <Text style={styles.totalRowLabel}>Tổng trừ tài khoản</Text>
                <Text style={styles.totalRowValue}>{formatVND(currentInvoice.amountDue)}</Text>
              </View>
            </GlassView>

            {/* Execute Payment Button */}
            <Pressable
              onPress={handleExecutePayment}
              disabled={isSubmittingPayment}
              style={({ pressed }) => [
                styles.primaryBtn,
                isSubmittingPayment && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Xác nhận thanh toán"
            >
              <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={styles.primaryBtnInner}>
                {isSubmittingPayment ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Xác nhận thanh toán</Text>
                )}
              </GlassView>
            </Pressable>

            {/* Edit action */}
            <Pressable
              onPress={() => setStep('details')}
              disabled={isSubmittingPayment}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Chỉnh sửa thông tin"
            >
              <Text style={styles.secondaryBtnText}>Chỉnh sửa thông tin</Text>
            </Pressable>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 6: PAYMENT RESULT                                               */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 'result' && completedTx && (
          <View style={styles.resultContainer}>
            {/* Success Icon Badge */}
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <CheckCircle2 size={48} color={Palette.incomeGreen} strokeWidth={2} />
              </View>
            </View>

            <Text style={styles.resultHeading}>Thanh toán thành công!</Text>
            <Text style={styles.resultAmount}>-{formatVND(completedTx.invoice.amountDue)}</Text>

            {/* Receipt Table Card */}
            <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã giao dịch</Text>
                <View style={styles.refRow}>
                  <Text style={styles.detailValue}>{completedTx.referenceCode}</Text>
                  <Pressable
                    onPress={() => handleCopyCode(completedTx.referenceCode)}
                    hitSlop={8}
                    style={styles.copyBtn}
                    accessibilityLabel="Sao chép mã giao dịch"
                  >
                    {copyFeedback ? (
                      <CheckCircle2 size={16} color={Palette.incomeGreen} strokeWidth={2} />
                    ) : (
                      <Copy size={16} color={Palette.secondary} strokeWidth={1.75} />
                    )}
                  </Pressable>
                </View>
              </View>

              {copyFeedback && (
                <View style={styles.copyFeedbackRow}>
                  <CheckCircle2 size={12} color={Palette.incomeGreen} strokeWidth={2} />
                  <Text style={styles.copyFeedbackText}>Đã sao chép mã giao dịch</Text>
                </View>
              )}

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{completedTx.timestamp}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dịch vụ</Text>
                <Text style={styles.detailValueBold}>{completedTx.service.title}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nhà cung cấp</Text>
                <Text style={styles.detailValue}>{completedTx.provider.name}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Khách hàng</Text>
                <Text style={styles.detailValueBold}>{completedTx.invoice.customerName}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã khách hàng</Text>
                <Text style={styles.detailValue}>{completedTx.invoice.customerCode}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kỳ thanh toán</Text>
                <Text style={styles.detailValue}>{completedTx.invoice.billingPeriod}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tài khoản nguồn</Text>
                <Text style={styles.detailValue}>
                  {maskAccountNumber(completedTx.account.accountNumber)}
                </Text>
              </View>
            </GlassView>

            {/* Actions */}
            <View style={styles.resultActions}>
              <Pressable
                onPress={handleShareReceipt}
                style={({ pressed }) => [styles.shareBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Chia sẻ biên lai"
              >
                <GlassView
                  variant="card"
                  borderRadius={Radius.lg}
                  luminousBorder
                  style={styles.shareBtnInner}
                >
                  <Share2 size={18} color={Palette.white} strokeWidth={1.75} />
                  <Text style={styles.shareBtnText}>Chia sẻ biên lai</Text>
                </GlassView>
              </Pressable>

              <Pressable
                onPress={handleRestart}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Thanh toán hóa đơn khác"
              >
                <Text style={styles.secondaryBtnText}>Thanh toán hóa đơn khác</Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Về trang chủ"
              >
                <Text style={styles.secondaryBtnText}>Về trang chủ</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Account Picker Modal Sheet ── */}
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
            <GlassView variant="card" borderRadius={Radius.xxl} luminousBorder style={styles.sheetContent}>
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
    </View>
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

  // Navigation Bar
  btnPressed: { opacity: 0.75 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // Search Bar
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceL2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.subheadline,
    color: Palette.white,
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: Spacing.xs,
  },

  // Sections
  sectionWrapper: {
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  cardGroup: {
    overflow: 'hidden',
  },

  // List Rows (Categories & Providers)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.09)',
  },
  listRowPressed: {
    backgroundColor: 'rgba(193, 160, 172, 0.06)',
  },
  rowIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(128, 108, 121, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowMeta: {
    flex: 1,
  },
  rowTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },

  // Step Intros
  stepIntro: {
    marginBottom: Spacing.lg,
  },
  stepIntroTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.xs,
  },
  stepIntroSubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    lineHeight: 18,
  },

  // Provider Badge
  providerBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  providerBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerBadgeInfo: {
    flex: 1,
  },
  providerBadgeName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  providerBadgeCategory: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 2,
  },
  changeProviderBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(193, 160, 172, 0.12)',
  },
  changeProviderText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.light,
    fontWeight: Typography.fontWeight.medium,
  },

  // Lookup Input
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceL2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.12)',
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.wide,
  },
  clearInputBtn: {
    padding: Spacing.xs,
  },
  inputHelperText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },

  // Sample Test Codes
  sampleCodesSection: {
    marginBottom: Spacing.xl,
  },
  sampleCodesTitle: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  sampleCodesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sampleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(193, 160, 172, 0.20)',
  },
  sampleChipText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.light,
  },

  // Notice Banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  noticeBannerError: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  noticeBannerWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.35)',
  },
  noticeBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.footnote,
    color: Palette.white,
    lineHeight: 18,
  },

  // Details Card
  detailsCard: {
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    marginVertical: Spacing.sm,
  },
  totalRowLabel: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  totalRowValue: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.incomeGreen,
    letterSpacing: Typography.letterSpacing.tight,
  },

  // Action Buttons
  primaryBtn: {
    height: 50,
    marginTop: Spacing.xl,
  },
  primaryBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 108, 121, 0.65)',
  },
  primaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  secondaryBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    marginTop: Spacing.md,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
  },

  // Result Screen
  resultContainer: {
    alignItems: 'center',
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  successIconInner: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(50, 215, 75, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultHeading: {
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.xs,
  },
  resultAmount: {
    fontSize: Typography.fontSize.largeTitle,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
    marginBottom: Spacing.xl,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  copyBtn: {
    padding: 4,
  },
  copyFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 2,
  },
  copyFeedbackText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.incomeGreen,
  },
  resultActions: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  shareBtn: {
    height: 50,
    marginBottom: Spacing.md,
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

  // Account Modal Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 14, 0.75)',
    justifyContent: 'flex-end',
  },
  accountSheetContainer: {
    maxHeight: '80%',
    paddingHorizontal: Spacing.md,
  },
  sheetContent: {
    padding: Spacing.xl,
    backgroundColor: 'rgba(28, 22, 36, 0.96)',
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
    letterSpacing: Typography.letterSpacing.tight,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(193, 160, 172, 0.10)',
  },
  accountList: {
    gap: Spacing.sm,
  },
  accountOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(32, 26, 39, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    gap: Spacing.md,
  },
  accountOptionRowActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderColor: Palette.light,
  },
  accountOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountOptionMeta: {
    flex: 1,
  },
  accountOptionTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 2,
  },
  accountOptionSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  selectedCheck: {
    padding: Spacing.xs,
  },
});
