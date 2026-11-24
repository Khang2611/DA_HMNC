import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Share2,
  Camera as CameraIcon,
  RefreshCw,
} from 'lucide-react-native';
import {
  CameraView,
  useCameraPermissions,
  scanFromURLAsync,
  BarcodeScanningResult,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Account, Bank, Transaction } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber, formatVNDInput } from '../utils/formatters';
import { lookupRecipientName } from '../data/mockRecipients';
import { GlassView } from '../components/GlassView';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { ScreenHeader } from '../components/ScreenHeader';
import { parseVietQRPayload } from '../utils/vietqr';
import { ReceiveQRScreen } from './ReceiveQRScreen';
import { FeedbackDialog, FeedbackVariant } from '../components/FeedbackDialog';

export interface QRScannerScreenProps {
  accounts: Account[];
  initialAccountIndex?: number;
  onClose: () => void;
  onTransferSuccess?: (tx: Transaction) => void;
}

type ScanFlowStep = 'scanner' | 'review' | 'confirmation' | 'otp' | 'result';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  accounts,
  initialAccountIndex = 0,
  onClose,
  onTransferSuccess,
}) => {
  const insets = useSafeAreaInsets();

  // Flow State
  const [step, setStep] = useState<ScanFlowStep>('scanner');
  const [isReceiveQROpen, setIsReceiveQROpen] = useState(false);

  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0); // 0 to 1
  const [isProcessing, setIsProcessing] = useState(false);

  // Extracted QR Transfer Details
  const [recipientBank, setRecipientBank] = useState<Bank | null>(null);
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferAmountInput, setTransferAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [transferDescription, setTransferDescription] = useState('Chuyen tien VietQR Napas 247');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const otpInputRefs = useRef<(TextInputInstance | null)[]>([]);

  // Completed Transaction State
  const [completedTx, setCompletedTx] = useState<{
    code: string;
    amount: number;
    recipientName: string;
    recipientAccount: string;
    bankName: string;
    timestamp: string;
    description: string;
  } | null>(null);

  const currentSourceAccount = accounts[selectedAccountIndex] || accounts[0];

  // OTP Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  // Prevent duplicate scans
  const lastScannedTimeRef = useRef(0);

  const [feedback, setFeedback] = useState<{
    visible: boolean;
    variant: FeedbackVariant;
    title: string;
    message: string;
    buttonLabel?: string;
    onClose?: () => void;
  }>({
    visible: false,
    variant: 'error',
    title: '',
    message: '',
  });

  // ── Handle QR Decoding & Validation ───────────────────────────────────
  const processQRData = (data: string) => {
    const now = Date.now();
    if (now - lastScannedTimeRef.current < 2000) return; // Debounce 2 seconds
    lastScannedTimeRef.current = now;

    setIsProcessing(true);

    const parsed = parseVietQRPayload(data);

    if (!parsed.isValid || !parsed.accountNumber || !parsed.bank) {
      setIsProcessing(false);
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Mã QR không được hỗ trợ',
        message:
          parsed.errorMessage ||
          'Mã QR không đúng định dạng thanh toán VietQR / Napas 247 hoặc không chứa thông tin tài khoản hợp lệ.',
        buttonLabel: 'Quét lại',
        onClose: () => {
          setIsProcessing(false);
        },
      });
      return;
    }

    // Lookup verified beneficiary name via Napas 247 service
    const verifiedName = lookupRecipientName(parsed.bank.id, parsed.accountNumber);

    setRecipientBank(parsed.bank);
    setRecipientAccount(parsed.accountNumber);
    setRecipientName(verifiedName);

    // If QR payload specifies an amount
    if (parsed.amount && parsed.amount > 0) {
      setRawAmount(parsed.amount);
      setTransferAmountInput(formatVNDInput(parsed.amount));
    } else {
      setRawAmount(0);
      setTransferAmountInput('');
    }

    // If QR specifies description
    if (parsed.description) {
      setTransferDescription(parsed.description);
    } else {
      setTransferDescription(`Chuyen tien Napas 247 den ${parsed.accountNumber}`);
    }

    setIsProcessing(false);
    setStep('review');
  };

  // Barcode scanned from live camera
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isProcessing || step !== 'scanner' || isReceiveQROpen) return;
    if (result.data) {
      processQRData(result.data);
    }
  };

  // Pick QR from Gallery
  const handlePickFromGallery = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) {
        return;
      }

      setIsProcessing(true);
      const imageUri = pickerResult.assets[0].uri;

      // Decode QR from selected image URL
      const scanResults = await scanFromURLAsync(imageUri, ['qr']);

      if (scanResults && scanResults.length > 0 && scanResults[0].data) {
        processQRData(scanResults[0].data);
      } else {
        setIsProcessing(false);
        setFeedback({
          visible: true,
          variant: 'warning',
          title: 'Không tìm thấy mã QR',
          message: 'Không thể nhận diện mã QR trong hình ảnh đã chọn. Vui lòng chọn ảnh chụp rõ nét hơn.',
          buttonLabel: 'Đã hiểu',
          onClose: () => setIsProcessing(false),
        });
      }
    } catch {
      setIsProcessing(false);
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Lỗi đọc hình ảnh',
        message: 'Đã xảy ra lỗi trong quá trình xử lý hình ảnh. Vui lòng thử lại.',
        buttonLabel: 'Đóng',
        onClose: () => setIsProcessing(false),
      });
    }
  };

  // Zoom controls (clamped 0 to 1)
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0, parseFloat((prev - 0.25).toFixed(2))));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(1, parseFloat((prev + 0.25).toFixed(2))));
  };

  // Amount input
  const handleAmountChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    const num = parseInt(numeric, 10) || 0;
    setRawAmount(num);
    setTransferAmountInput(num > 0 ? formatVNDInput(num) : '');
  };

  const handleQuickAmount = (val: number) => {
    setRawAmount(val);
    setTransferAmountInput(formatVNDInput(val));
  };

  // OTP Flow
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError('');

    if (digit.length > 0 && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyAndCompleteTransfer = (otpCode: string) => {
    if (isVerifyingOtp || !recipientBank) return;
    setIsVerifyingOtp(true);

    setTimeout(() => {
      setIsVerifyingOtp(false);
      if (otpCode === '123456') {
        const timestamp = new Date();
        const formattedDate = `${timestamp.toLocaleDateString('vi-VN')} ${timestamp.toLocaleTimeString('vi-VN')}`;
        const txCode = `QR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

        const payloadTx: Transaction = {
          id: `tx_${Date.now()}`,
          title: `Chuyển tiền VietQR - ${recipientName}`,
          category: 'Chuyển tiền',
          amount: -rawAmount,
          timestamp: 'Vừa xong',
          type: 'transfer_out',
          recipientName: recipientName,
          recipientBank: recipientBank.shortName,
          note: transferDescription,
        };

        setCompletedTx({
          code: txCode,
          amount: rawAmount,
          recipientName,
          recipientAccount,
          bankName: recipientBank.name,
          timestamp: formattedDate,
          description: transferDescription,
        });

        onTransferSuccess?.(payloadTx);
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
    if (!completedTx) return;
    try {
      await Share.share({
        title: 'Biên lai chuyển tiền VietQR',
        message:
          `[MAUVE DIGITAL BANKING - BIÊN LAI CHUYỂN TIỀN VIETQR]\n` +
          `Trạng thái: Chuyển tiền thành công (Mô phỏng Napas 247)\n` +
          `Số tiền: ${formatVND(completedTx.amount)}\n` +
          `Người nhận: ${completedTx.recipientName}\n` +
          `Số tài khoản nhận: ${completedTx.recipientAccount}\n` +
          `Ngân hàng: ${completedTx.bankName}\n` +
          `Mã giao dịch: ${completedTx.code}\n` +
          `Thời gian: ${completedTx.timestamp}\n` +
          `Nội dung: ${completedTx.description}\n` +
          `Phí giao dịch: Miễn phí (0 ₫)`,
      });
    } catch {
      // dismissed
    }
  };

  const isFormValid =
    rawAmount >= 10000 &&
    rawAmount <= currentSourceAccount.balance &&
    recipientAccount.length >= 6;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Screen Views
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: QR SCANNER (APPROVED LAYOUT MATCHING REFERENCE)
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'scanner' && (
        <View style={styles.scannerRoot}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Quét mã QR"
            onBack={onClose}
            backLabel="Quay lại Trang chủ"
            rightElement={
              <Pressable
                onPress={() => setTorch((prev) => !prev)}
                hitSlop={12}
                style={({ pressed }) => [styles.navBarRightBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={torch ? 'Tắt đèn pin' : 'Bật đèn pin'}
              >
                {torch ? (
                  <Zap size={22} color={Palette.light} fill={Palette.light} />
                ) : (
                  <ZapOff size={22} color={Palette.light} strokeWidth={1.75} />
                )}
              </Pressable>
            }
          />

          {/* Main Content Area */}
          <View style={styles.scannerBody}>
            {/* Camera Preview Container: Large Rounded Rectangle, occupies most screen height */}
            <View style={styles.cameraFrame}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torch}
                  zoom={zoom}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
                />
              ) : (
                <View style={styles.permissionFallback}>
                  <CameraIcon size={44} color={Palette.secondary} strokeWidth={1.5} />
                  <Text style={styles.fallbackHeading}>Quyền truy cập Camera</Text>
                  <Text style={styles.fallbackText}>
                    Vui lòng cấp quyền camera để quét mã thanh toán VietQR và Napas 247 nhanh chóng.
                  </Text>
                  <Pressable
                    onPress={requestPermission}
                    style={styles.requestPermissionBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.requestPermissionBtnText}>Cho phép truy cập Camera</Text>
                  </Pressable>
                </View>
              )}

              {/* Processing Spinner Overlay */}
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={Palette.light} />
                  <Text style={styles.processingText}>Đang nhận diện mã QR...</Text>
                </View>
              )}

              {/* Gallery Button: Dark translucent pill inside preview near bottom edge */}
              <Pressable
                onPress={handlePickFromGallery}
                disabled={isProcessing}
                style={({ pressed }) => [styles.galleryPill, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Chọn mã QR từ thư viện ảnh"
              >
                <ImageIcon size={18} color={Palette.light} strokeWidth={1.75} />
                <Text style={styles.galleryPillText}>Chọn từ ảnh</Text>
              </Pressable>
            </View>

            {/* Camera Zoom Control: Horizontal slider / step bar below preview */}
            <View style={styles.zoomControlRow}>
              <Pressable
                onPress={handleZoomOut}
                hitSlop={10}
                style={styles.zoomBtn}
                accessibilityRole="button"
                accessibilityLabel="Thu nhỏ"
              >
                <Minus size={18} color={Palette.secondary} strokeWidth={2} />
              </Pressable>

              <View style={styles.zoomTrack}>
                <View style={[styles.zoomFill, { width: `${Math.round(zoom * 100)}%` }]} />
              </View>

              <Pressable
                onPress={handleZoomIn}
                hitSlop={10}
                style={styles.zoomBtn}
                accessibilityRole="button"
                accessibilityLabel="Phóng to"
              >
                <Plus size={18} color={Palette.secondary} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Bottom Action: "Tạo QR nhận tiền" - Large full-width rounded button with QR icon */}
            <View
              style={[
                styles.bottomActionContainer,
                { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.xs },
              ]}
            >
              <Pressable
                onPress={() => setIsReceiveQROpen(true)}
                style={({ pressed }) => [
                  styles.receiveQrActionBtn,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Tạo mã QR nhận tiền"
              >
                <QrCode size={20} color={Palette.light} strokeWidth={1.75} />
                <Text style={styles.receiveQrActionBtnText}>Tạo QR nhận tiền</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: REVIEW TRANSFER DETAILS (SCANNED QR)
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'review' && recipientBank && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Thông tin chuyển tiền"
            onBack={() => setStep('scanner')}
            backLabel="Quay lại Quét QR"
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flexOne}
          >
            <ScrollView
              style={styles.flexOne}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Source Account Selector */}
              <View style={styles.sectionBlock}>
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

              {/* Scanned Beneficiary Info Card */}
              <GlassView variant="card" borderRadius={Radius.xl} style={styles.formCard}>
                <Text style={styles.cardHeaderTitle}>Người nhận (VietQR Napas 247)</Text>

                {/* Bank row */}
                <View style={styles.beneficiaryBankRow}>
                  <View style={styles.bankIconCircle}>
                    <Building2 size={18} color={Palette.light} strokeWidth={1.75} />
                  </View>
                  <View style={styles.beneficiaryBankMeta}>
                    <Text style={styles.beneficiaryBankShort}>{recipientBank.shortName}</Text>
                    <Text style={styles.beneficiaryBankFull} numberOfLines={1}>
                      {recipientBank.name}
                    </Text>
                  </View>
                </View>

                {/* Verified name box */}
                <View style={styles.verifiedNameBox}>
                  <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={2} />
                  <View style={styles.verifiedMeta}>
                    <Text style={styles.verifiedTitle}>TÊN NGƯỜI THỤ HƯỞNG</Text>
                    <Text style={styles.verifiedName}>{recipientName.toUpperCase()}</Text>
                    <Text style={styles.verifiedAccount}>STK: {recipientAccount}</Text>
                  </View>
                </View>
              </GlassView>

              {/* Amount & Description Card */}
              <GlassView variant="card" borderRadius={Radius.xl} style={[styles.formCard, { marginTop: Spacing.md }]}>
                <Text style={styles.cardHeaderTitle}>Số tiền & Nội dung</Text>

                {/* Amount input */}
                <Text style={styles.inputFieldLabel}>Số tiền chuyển</Text>
                <View style={styles.amountInputRow}>
                  <TextInput
                    value={transferAmountInput}
                    onChangeText={handleAmountChange}
                    placeholder="Nhập số tiền"
                    placeholderTextColor="rgba(193, 160, 172, 0.45)"
                    keyboardType="numeric"
                    style={styles.amountTextInput}
                  />
                  <Text style={styles.currencySuffix}>VND</Text>
                </View>

                {rawAmount > currentSourceAccount.balance && (
                  <Text style={styles.errorText}>
                    Số dư không đủ ({formatVND(currentSourceAccount.balance)})
                  </Text>
                )}
                {rawAmount > 0 && rawAmount < 10000 && (
                  <Text style={styles.warningText}>Số tiền chuyển tối thiểu là 10.000 ₫</Text>
                )}

                {/* Quick amount chips */}
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
                </View>

                {/* Description */}
                <Text style={[styles.inputFieldLabel, { marginTop: Spacing.md }]}>
                  Nội dung chuyển tiền
                </Text>
                <View style={styles.inputBoxRow}>
                  <TextInput
                    value={transferDescription}
                    onChangeText={setTransferDescription}
                    placeholder="Nhập nội dung chuyển tiền"
                    placeholderTextColor="rgba(193, 160, 172, 0.45)"
                    maxLength={70}
                    style={styles.textInputMain}
                  />
                </View>

                {/* Fee row */}
                <View style={styles.feeInfoRow}>
                  <Text style={styles.feeInfoLabel}>Phí giao dịch:</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Miễn phí (Napas 247)</Text>
                  </View>
                </View>
              </GlassView>

              {/* Action Button inside ScrollView */}
              <View style={styles.scrollActionWrapper}>
                <Pressable
                  onPress={() => setStep('confirmation')}
                  disabled={!isFormValid}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    !isFormValid && styles.primaryActionBtnDisabled,
                    pressed && isFormValid && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Tiếp tục đến xác nhận"
                >
                  <Text
                    style={[
                      styles.primaryActionBtnText,
                      !isFormValid && styles.primaryActionBtnTextDisabled,
                    ]}
                  >
                    Tiếp tục
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 3: CONFIRMATION
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'confirmation' && recipientBank && (
        <View style={styles.root}>
          {/* ── Standard Screen Header ── */}
          <ScreenHeader
            title="Xác nhận chuyển tiền"
            onBack={() => setStep('review')}
            backLabel="Quay lại kiểm tra"
          />

          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount Hero */}
            <View style={styles.confirmAmountHero}>
              <Text style={styles.confirmAmountLabel}>SỐ TIỀN CHUYỂN</Text>
              <Text style={styles.confirmAmountValue}>{formatVND(rawAmount)}</Text>
              <View style={styles.confirmFreeBadge}>
                <Text style={styles.confirmFreeBadgeText}>Miễn phí chuyển nhanh VietQR 247</Text>
              </View>
            </View>

            {/* Details Summary Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
              <Text style={styles.cardHeaderTitle}>Chi tiết giao dịch</Text>

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
                <Text style={styles.summaryRowLabel}>Người thụ hưởng</Text>
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
                  <Text style={styles.summaryRowValueBold}>{recipientBank.shortName}</Text>
                  <Text style={styles.summaryRowValueSub} numberOfLines={1}>
                    {recipientBank.name}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Phương thức</Text>
                <Text style={styles.summaryRowValueBold}>Quét mã VietQR (Napas 247)</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Nội dung</Text>
                <Text style={[styles.summaryRowValueBold, { flex: 1, textAlign: 'right' }]}>
                  {transferDescription}
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

            {/* Actions */}
            <View style={styles.scrollActionWrapper}>
              <Pressable
                onPress={() => {
                  setOtpDigits(['', '', '', '', '', '']);
                  setOtpCountdown(60);
                  setStep('otp');
                }}
                style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Xác nhận và xác thực OTP"
              >
                <ShieldCheck size={20} color={Palette.white} strokeWidth={2} />
                <Text style={styles.primaryActionBtnText}>Xác nhận &amp; Xác thực</Text>
              </Pressable>

              <Pressable
                onPress={() => setStep('review')}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa thông tin"
              >
                <Text style={styles.secondaryBtnText}>Chỉnh sửa thông tin</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 4: SMART OTP
      ══════════════════════════════════════════════════════════════════════ */}
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
                Mã bảo mật OTP đã được kích hoạt cho giao dịch VietQR {formatVND(rawAmount)} đến{' '}
                <Text style={{ color: Palette.light, fontWeight: '600' }}>{recipientName}</Text>.
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
                    onPress={() => setOtpCountdown(60)}
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
                  onPress={() => verifyAndCompleteTransfer(otpDigits.join(''))}
                  disabled={otpDigits.join('').length < 6 || isVerifyingOtp}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    (otpDigits.join('').length < 6 || isVerifyingOtp) &&
                      styles.primaryActionBtnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Xác nhận chuyển khoản"
                >
                  <Text style={styles.primaryActionBtnText}>Xác nhận chuyển khoản</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 5: RESULT / RECEIPT
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'result' && completedTx && (
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
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Success Status Hero */}
            <View style={styles.resultHero}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={36} color={Palette.incomeGreen} strokeWidth={2.2} />
              </View>
              <Text style={styles.resultHeading}>Chuyển tiền thành công!</Text>
              <Text style={styles.resultAmount}>-{formatVND(completedTx.amount)}</Text>
              <View style={styles.simulatedDemoBadge}>
                <Text style={styles.simulatedDemoBadgeText}>VIETQR NAPAS 247 (DEMO)</Text>
              </View>
            </View>

            {/* Detailed Receipt Card */}
            <GlassView variant="card" borderRadius={Radius.xl} style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Mã giao dịch</Text>
                <Text style={[styles.summaryRowValueBold, { letterSpacing: 0.5 }]}>
                  {completedTx.code}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Thời gian</Text>
                <Text style={styles.summaryRowValueBold}>{completedTx.timestamp}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Người nhận</Text>
                <View style={styles.summaryRowValueCol}>
                  <Text style={[styles.summaryRowValueBold, { color: Palette.light }]}>
                    {completedTx.recipientName}
                  </Text>
                  <Text style={styles.summaryRowValueSub}>{completedTx.recipientAccount}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Ngân hàng nhận</Text>
                <Text style={styles.summaryRowValueBold}>{completedTx.bankName}</Text>
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
                  {completedTx.description}
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

            {/* Action Buttons */}
            <View style={styles.scrollActionWrapper}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Về trang chủ"
              >
                <Text style={styles.primaryActionBtnText}>Về trang chủ</Text>
              </Pressable>

              <Pressable
                onPress={handleShareReceipt}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Chia sẻ biên lai"
              >
                <Share2 size={16} color={Palette.light} strokeWidth={1.75} />
                <Text style={styles.secondaryBtnText}>Chia sẻ biên lai</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: RECEIVE QR SCREEN
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isReceiveQROpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsReceiveQROpen(false)}
      >
        <ReceiveQRScreen
          accounts={accounts}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsReceiveQROpen(false)}
        />
      </Modal>

      {/* ── Feedback Dialog ── */}
      <FeedbackDialog
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        buttonLabel={feedback.buttonLabel}
        onClose={() => {
          const cb = feedback.onClose;
          setFeedback((f) => ({ ...f, visible: false }));
          if (cb) cb();
        }}
      />
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

  navBarRightBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },

  // ── QR Scanner Screen Specific Layout ─────────
  scannerRoot: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scannerBody: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  cameraFrame: {
    flex: 1,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    backgroundColor: '#0D0B12',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
  },
  permissionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#1E1826',
  },
  fallbackHeading: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginTop: Spacing.md,
  },
  fallbackText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  requestPermissionBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.light,
  },
  requestPermissionBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(22, 19, 31, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  processingText: {
    color: Palette.light,
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.md,
  },

  // Gallery pill inside camera preview
  galleryPill: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(30, 24, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.30)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    zIndex: 3,
  },
  galleryPillText: {
    color: Palette.white,
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
  },

  // Zoom control
  zoomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(48, 38, 56, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
  },
  zoomTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(193, 160, 172, 0.20)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  zoomFill: {
    height: '100%',
    backgroundColor: Palette.light,
    borderRadius: 2,
  },

  // Bottom action
  bottomActionContainer: {
    width: '100%',
  },
  receiveQrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(128, 108, 121, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.30)',
  },
  receiveQrActionBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },

  // ── Scroll Content for Review & Results ────────
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  sectionBlock: {
    marginBottom: Spacing.md,
  },
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

  // Beneficiary details
  beneficiaryBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bankIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  beneficiaryBankMeta: {
    flex: 1,
  },
  beneficiaryBankShort: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  beneficiaryBankFull: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: 1,
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
  verifiedAccount: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.light,
    marginTop: 2,
  },

  // Inputs
  inputFieldLabel: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    marginBottom: Spacing.xs,
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

  // Confirmation hero
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

  // Summary Card
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

  // OTP Styles
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

  // Result Styles
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

  // Action Buttons
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
