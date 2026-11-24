import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Share2,
  Download,
  Building2,
  Sparkles,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { Account, Bank } from '../types/banking';
import { VIETNAMESE_BANKS } from '../data/mockRecipients';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber, formatVNDInput } from '../utils/formatters';
import { GlassView } from '../components/GlassView';
import { SourceAccountSelector } from '../components/SourceAccountSelector';
import { generateVietQRPayload } from '../utils/vietqr';
import { FeedbackDialog } from '../components/FeedbackDialog';
import { ScreenHeader } from '../components/ScreenHeader';

export interface ReceiveQRScreenProps {
  accounts: Account[];
  initialAccountIndex?: number;
  onClose: () => void;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const ReceiveQRScreen: React.FC<ReceiveQRScreenProps> = ({
  accounts,
  initialAccountIndex = 0,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const [selectedAccountIndex, setSelectedAccountIndex] = useState(initialAccountIndex);
  const [amountInput, setAmountInput] = useState('');
  const [rawAmount, setRawAmount] = useState(0);
  const [description, setDescription] = useState('Chuyen tien VietQR');

  // Default demo bank: Techcombank (TCB - BIN 970407)
  const [receivingBank, setReceivingBank] = useState<Bank>(VIETNAMESE_BANKS[1]);
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(false);

  const qrSvgRef = useRef<any>(null);

  const currentAccount = accounts[selectedAccountIndex] || accounts[0];
  const accountHolderName = 'QUY NGUYEN';

  // Handle amount change
  const handleAmountChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    const num = parseInt(numeric, 10) || 0;
    setRawAmount(num);
    setAmountInput(num > 0 ? formatVNDInput(num) : '');
  };

  const handleQuickAmount = (val: number) => {
    setRawAmount(val);
    setAmountInput(formatVNDInput(val));
  };

  // Generate official EMVCo-compliant VietQR payload
  const qrPayload = generateVietQRPayload({
    bankBin: receivingBank.bin,
    accountNumber: currentAccount.accountNumber,
    amount: rawAmount > 0 ? rawAmount : undefined,
    description: description.trim() || undefined,
  });

  // Share QR code and payment info
  const handleShareQR = async () => {
    try {
      const shareMessage =
        `[MAUVE BANKING - MÃ VIETQR NHẬN TIỀN DEMO]\n` +
        `Chủ tài khoản: ${accountHolderName}\n` +
        `Ngân hàng: ${receivingBank.shortName} (${receivingBank.name})\n` +
        `Số tài khoản: ${currentAccount.accountNumber}\n` +
        (rawAmount > 0 ? `Số tiền yêu cầu: ${formatVND(rawAmount)}\n` : '') +
        (description ? `Nội dung: ${description}\n` : '') +
        `Chuỗi mã EMVCo: ${qrPayload}`;

      await Share.share({
        title: 'Mã QR nhận tiền Napas 247',
        message: shareMessage,
      });
    } catch {
      // share dismissed
    }
  };

  // Save QR image to gallery
  const handleSaveQR = () => {
    setIsSaveSuccessOpen(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader
        title="Mã QR nhận tiền"
        onBack={onClose}
        rightElement={
          <Pressable
            onPress={handleShareQR}
            hitSlop={12}
            style={({ pressed }) => [styles.navBarRightBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Chia sẻ"
          >
            <Share2 size={20} color={Palette.light} strokeWidth={1.75} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Receiving Account Selector */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>TÀI KHOẢN NHẬN TIỀN</Text>
            <SourceAccountSelector
              account={currentAccount}
              canSwitch={accounts.length > 1}
              onPress={() => {
                if (accounts.length > 1) {
                  setSelectedAccountIndex((prev) => (prev + 1) % accounts.length);
                }
              }}
            />
          </View>

          {/* Prominent High-Contrast VietQR Card */}
          <View style={styles.qrCardContainer}>
            {/* Header info on white card */}
            <View style={styles.qrCardHeader}>
              <View style={styles.napasBadge}>
                <Text style={styles.napasBadgeText}>VIETQR · NAPAS 247</Text>
              </View>
              <View style={styles.demoPill}>
                <Sparkles size={11} color="#806C79" />
                <Text style={styles.demoPillText}>DEMO</Text>
              </View>
            </View>

            {/* Bank Info */}
            <View style={styles.qrBankRow}>
              <Building2 size={16} color="#4A3F4B" strokeWidth={1.75} />
              <Text style={styles.qrBankName}>
                {receivingBank.shortName} (BIN {receivingBank.bin})
              </Text>
            </View>

            {/* Actual High-Contrast SVG QR Code */}
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={qrPayload}
                size={220}
                color="#16131F"
                backgroundColor="#FFFFFF"
                getRef={(c) => (qrSvgRef.current = c)}
                logoSize={32}
                logoMargin={2}
                logoBorderRadius={16}
              />
            </View>

            {/* Beneficiary Details */}
            <View style={styles.beneficiaryMeta}>
              <Text style={styles.beneficiaryName}>{accountHolderName}</Text>
              <Text style={styles.beneficiaryAccount}>
                STK: {currentAccount.accountNumber}
              </Text>
              {rawAmount > 0 && (
                <View style={styles.amountBadge}>
                  <Text style={styles.amountBadgeText}>{formatVND(rawAmount)}</Text>
                </View>
              )}
              {description ? (
                <Text style={styles.descriptionCaption} numberOfLines={2}>
                  {description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Customization Details Form Card */}
          <GlassView variant="card" borderRadius={Radius.xl} style={styles.customCard}>
            <Text style={styles.cardHeaderTitle}>Tùy chỉnh thông tin nhận tiền</Text>

            {/* Amount input */}
            <Text style={styles.inputFieldLabel}>Số tiền nhận (Tùy chọn)</Text>
            <View style={styles.inputBoxRow}>
              <TextInput
                value={amountInput}
                onChangeText={handleAmountChange}
                placeholder="Nhập số tiền"
                placeholderTextColor="rgba(193, 160, 172, 0.45)"
                keyboardType="numeric"
                style={styles.textInputMain}
              />
              <Text style={styles.currencySuffix}>VND</Text>
            </View>

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
              {rawAmount > 0 && (
                <Pressable
                  onPress={() => {
                    setRawAmount(0);
                    setAmountInput('');
                  }}
                  style={styles.quickAmountChip}
                >
                  <Text style={styles.quickAmountText}>Xóa số tiền</Text>
                </Pressable>
              )}
            </View>

            {/* Description input */}
            <Text style={[styles.inputFieldLabel, { marginTop: Spacing.md }]}>
              Nội dung nhận tiền
            </Text>
            <View style={styles.inputBoxRow}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập nội dung chuyển tiền"
                placeholderTextColor="rgba(193, 160, 172, 0.45)"
                maxLength={60}
                style={styles.textInputMain}
              />
            </View>

            {/* Bank partner selector */}
            <View style={styles.bankSelectRow}>
              <Text style={styles.inputFieldLabel}>Ngân hàng thụ hưởng (Demo):</Text>
              <Pressable
                onPress={() => {
                  const nextIdx =
                    (VIETNAMESE_BANKS.findIndex((b) => b.id === receivingBank.id) + 1) %
                    VIETNAMESE_BANKS.length;
                  setReceivingBank(VIETNAMESE_BANKS[nextIdx]);
                }}
                style={styles.bankChip}
              >
                <Text style={styles.bankChipText}>{receivingBank.shortName} ▾</Text>
              </Pressable>
            </View>
          </GlassView>

          {/* Action Buttons inside scrollable flow */}
          <View style={styles.actionsWrapper}>
            {/* Share QR Button */}
            <Pressable
              onPress={handleShareQR}
              style={({ pressed }) => [styles.shareBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Chia sẻ mã QR"
            >
              <Share2 size={18} color={Palette.white} strokeWidth={2} />
              <Text style={styles.shareBtnText}>Chia sẻ mã QR</Text>
            </Pressable>

            {/* Save Image Button */}
            <Pressable
              onPress={handleSaveQR}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Lưu vào thư viện ảnh"
            >
              <Download size={18} color={Palette.light} strokeWidth={2} />
              <Text style={styles.saveBtnText}>Lưu hình ảnh</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackDialog
        visible={isSaveSuccessOpen}
        variant="success"
        title="Lưu mã QR thành công"
        message={`Mã VietQR nhận tiền của ${accountHolderName} (${receivingBank.shortName} - ${maskAccountNumber(currentAccount.accountNumber)}) đã được xuất bản và lưu trữ trong thư viện ảnh thiết bị.`}
        onClose={() => setIsSaveSuccessOpen(false)}
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

  // ── Scroll Content ────────────────────────────
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  sectionBlock: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
  },

  // ── High Contrast White QR Card ───────────────
  qrCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.xs,
  },
  napasBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  napasBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: '#0054A6',
    letterSpacing: Typography.letterSpacing.wider,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(128, 108, 121, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  demoPillText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: '#4A3F4B',
  },
  qrBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  qrBankName: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: '#4A3F4B',
  },
  qrCodeWrapper: {
    padding: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneficiaryMeta: {
    alignItems: 'center',
    marginTop: Spacing.md,
    width: '100%',
  },
  beneficiaryName: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    color: '#16131F',
    letterSpacing: Typography.letterSpacing.wide,
  },
  beneficiaryAccount: {
    fontSize: Typography.fontSize.footnote,
    color: '#5C515B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  amountBadge: {
    backgroundColor: '#F0F9F1',
    borderWidth: 1,
    borderColor: '#34C759',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  amountBadgeText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: '#1E8E3E',
  },
  descriptionCaption: {
    fontSize: Typography.fontSize.caption1,
    color: '#7A6E78',
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Customization Form Card ───────────────────
  customCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeaderTitle: {
    fontSize: Typography.fontSize.subheadline,
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
  currencySuffix: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginLeft: Spacing.sm,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  quickAmountChip: {
    paddingVertical: 5,
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
  bankSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(193, 160, 172, 0.10)',
  },
  bankChip: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  bankChipText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },

  // ── Actions ───────────────────────────────────
  actionsWrapper: {
    gap: Spacing.md,
  },
  shareBtn: {
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
  shareBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(48, 38, 56, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.22)',
  },
  saveBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
});
