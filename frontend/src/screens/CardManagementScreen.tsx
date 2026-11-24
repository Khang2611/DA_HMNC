/**
 * CardManagementScreen — Quản lý thẻ
 *
 * Full Card Management module for Mauve Banking.
 * - Single continuous dark background (Palette.bg = '#16131F')
 * - Apple Wallet-inspired swipeable card carousel
 * - Distinct styles for Debit, Credit, and Napas cards
 * - Lock / Unlock cards with confirmation & shared state persistence
 * - Masked card details by default + Demo verification step before revealing CVV/number
 * - View & update daily spending limits with validation & presets
 * - Transaction controls (Online, International, Contactless switches)
 * - Report lost card ("Báo mất thẻ") with permanent disabling
 * - Card-specific transaction history with empty state & link to full history
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Modal,
  Dimensions,
  Platform,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Lock,
  Unlock,
  Eye,
  Sliders,
  AlertTriangle,
  Copy,
  CheckCircle2,
  X,
  CreditCard,
  Globe,
  ShoppingCart,
  Wifi,
  ShieldCheck,
  Info,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { Account, Transaction, BankCard } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { ScreenHeader } from '../components/ScreenHeader';
import { TransactionItem } from '../components/TransactionItem';
import { FeedbackDialog, FeedbackVariant } from '../components/FeedbackDialog';
import { ConfirmationBottomSheet } from '../components/ConfirmationBottomSheet';
import { formatVND, maskAccountNumber, formatVNDInput, parseVNDInput } from '../utils/formatters';
import { getCardStatusLabel } from '../data/mockCards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 336);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.618); // Golden ratio card proportion
const CARD_GAP = 16;
const CARD_SIDE_PADDING = Math.max((SCREEN_WIDTH - CARD_WIDTH) / 2, Spacing.lg);

// ─────────────────────────────────────────────────────────────────────────────
// Screen Props
// ─────────────────────────────────────────────────────────────────────────────

export interface CardManagementScreenProps {
  visible?: boolean;
  cards: BankCard[];
  accounts: Account[];
  transactions: Transaction[];
  onClose: () => void;
  onUpdateCard: (updatedCard: BankCard) => void;
  onOpenHistory?: (cardId?: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const CardManagementScreen: React.FC<CardManagementScreenProps> = ({
  cards,
  accounts,
  transactions,
  onClose,
  onUpdateCard,
  onOpenHistory,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.xl;

  // Selected Card Index in Carousel
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const cardListRef = useRef<FlatList<BankCard>>(null);

  const selectedCard: BankCard = cards[selectedCardIndex] || cards[0];

  // Modals State
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isDetailsVerifyModalOpen, setIsDetailsVerifyModalOpen] = useState(false);
  const [isDetailsRevealedModalOpen, setIsDetailsRevealedModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);

  // Card Limit Edit State
  const [newLimitInput, setNewLimitInput] = useState('');
  const [limitError, setLimitError] = useState('');

  // Clipboard Feedback State
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Standardized Feedback State
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    variant: FeedbackVariant;
    title: string;
    message: string;
  }>({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
  });

  // Linked Account for Selected Card
  const linkedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedCard.linkedAccountId);
  }, [accounts, selectedCard.linkedAccountId]);

  // Card-specific Transactions
  const cardTransactions = useMemo(() => {
    return transactions.filter((t) => t.cardId === selectedCard.id);
  }, [transactions, selectedCard.id]);

  // ── Carousel Scroll Handler ────────────────────────────────────────────────
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    const clampedIndex = Math.max(0, Math.min(cards.length - 1, index));
    if (clampedIndex !== selectedCardIndex) {
      setSelectedCardIndex(clampedIndex);
      // Auto-hide any revealed sensitive info when switching cards
      setIsDetailsRevealedModalOpen(false);
    }
  };

  // ── Card Action: Lock / Unlock ─────────────────────────────────────────────
  const handleLockUnlockPress = () => {
    if (selectedCard.status === 'lost') {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Thẻ đã báo mất',
        message: 'Thẻ đã báo mất vĩnh viễn không thể mở khóa trên ứng dụng. Vui lòng liên hệ Tổng đài 1900 8829 để được cấp thẻ mới.',
      });
      return;
    }

    if (selectedCard.status === 'active') {
      setIsLockModalOpen(true);
    } else if (selectedCard.status === 'locked') {
      // Unlock card
      const updated: BankCard = {
        ...selectedCard,
        status: 'active',
      };
      onUpdateCard(updated);
      setFeedback({
        visible: true,
        variant: 'success',
        title: 'Mở khóa thành công',
        message: `Thẻ ${selectedCard.cardName} đã được mở khóa và sẵn sàng giao dịch.`,
      });
    }
  };

  const confirmLockCard = () => {
    const updated: BankCard = {
      ...selectedCard,
      status: 'locked',
    };
    onUpdateCard(updated);
    setIsLockModalOpen(false);
    setFeedback({
      visible: true,
      variant: 'success',
      title: 'Khóa thẻ thành công',
      message: `Thẻ ${selectedCard.cardName} đã được tạm khóa an toàn.`,
    });
  };

  // ── Card Action: View Details (Demo Verification) ──────────────────────────
  const handleOpenDetails = () => {
    setIsDetailsVerifyModalOpen(true);
  };

  const handleVerifyDemoSuccess = () => {
    setIsDetailsVerifyModalOpen(false);
    setIsDetailsRevealedModalOpen(true);
  };

  const handleCopyCardNumber = async () => {
    if (!selectedCard.demoDetails) return;
    await Clipboard.setStringAsync(selectedCard.demoDetails.fullCardNumber.replace(/\s+/g, ''));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // ── Card Action: Spending Limit ────────────────────────────────────────────
  const handleOpenLimitModal = () => {
    setNewLimitInput(formatVNDInput(selectedCard.dailyLimit));
    setLimitError('');
    setIsLimitModalOpen(true);
  };

  const handlePresetLimit = (amount: number) => {
    setNewLimitInput(formatVNDInput(amount));
    setLimitError('');
  };

  const handleSaveLimit = () => {
    const num = parseVNDInput(newLimitInput);
    if (isNaN(num) || num <= 0) {
      setLimitError('Vui lòng nhập số tiền hạn mức hợp lệ.');
      return;
    }

    if (num < selectedCard.minDailyLimit) {
      setLimitError(`Hạn mức tối thiểu là ${formatVND(selectedCard.minDailyLimit)}.`);
      return;
    }

    if (num > selectedCard.maxDailyLimit) {
      setLimitError(`Hạn mức tối đa là ${formatVND(selectedCard.maxDailyLimit)}.`);
      return;
    }

    const updated: BankCard = {
      ...selectedCard,
      dailyLimit: num,
    };
    onUpdateCard(updated);
    setIsLimitModalOpen(false);
    setFeedback({
      visible: true,
      variant: 'success',
      title: 'Cập nhật thành công',
      message: `Hạn mức giao dịch ngày của thẻ ${selectedCard.cardName} đã được đổi thành ${formatVND(num)}/ngày.`,
    });
  };

  // ── Card Action: Report Lost Card ──────────────────────────────────────────
  const handleReportLostPress = () => {
    if (selectedCard.status === 'lost') {
      setFeedback({
        visible: true,
        variant: 'warning',
        title: 'Đã ghi nhận báo mất',
        message: 'Thẻ này đã được báo mất trước đó. Vui lòng liên hệ 1900 8829 để yêu cầu cấp lại thẻ mới.',
      });
      return;
    }
    setIsLostModalOpen(true);
  };

  const confirmReportLost = () => {
    const updated: BankCard = {
      ...selectedCard,
      status: 'lost',
    };
    onUpdateCard(updated);
    setIsLostModalOpen(false);
    setFeedback({
      visible: true,
      variant: 'success',
      title: 'Báo mất thẻ thành công',
      message: 'Thẻ của bạn đã được khóa vĩnh viễn để bảo vệ an toàn tài khoản. Vui lòng liên hệ 1900 8829 khi cần cấp lại thẻ mới.',
    });
  };

  // ── Card Switches: Feature Toggles ─────────────────────────────────────────
  const handleToggleOnline = (value: boolean) => {
    if (selectedCard.status === 'locked' || selectedCard.status === 'lost') {
      setFeedback({
        visible: true,
        variant: 'warning',
        title: 'Không thể thực hiện',
        message: 'Thẻ đang ở trạng thái khóa hoặc báo mất.',
      });
      return;
    }
    const updated: BankCard = {
      ...selectedCard,
      onlinePaymentsEnabled: value,
    };
    onUpdateCard(updated);
  };

  const handleToggleInternational = (value: boolean) => {
    if (selectedCard.status === 'locked' || selectedCard.status === 'lost') {
      setFeedback({
        visible: true,
        variant: 'warning',
        title: 'Không thể thực hiện',
        message: 'Thẻ đang ở trạng thái khóa hoặc báo mất.',
      });
      return;
    }
    if (selectedCard.network === 'napas') {
      setFeedback({
        visible: true,
        variant: 'info',
        title: 'Thẻ nội địa',
        message: 'Thẻ nội địa Napas chỉ hỗ trợ giao dịch trong lãnh thổ Việt Nam.',
      });
      return;
    }
    const updated: BankCard = {
      ...selectedCard,
      internationalPaymentsEnabled: value,
    };
    onUpdateCard(updated);
  };

  const handleToggleContactless = (value: boolean) => {
    if (selectedCard.status === 'locked' || selectedCard.status === 'lost') {
      setFeedback({
        visible: true,
        variant: 'warning',
        title: 'Không thể thực hiện',
        message: 'Thẻ đang ở trạng thái khóa hoặc báo mất.',
      });
      return;
    }
    const updated: BankCard = {
      ...selectedCard,
      contactlessEnabled: value,
    };
    onUpdateCard(updated);
  };

  // ── Render Individual Card in Carousel ─────────────────────────────────────
  const renderCardItem = ({ item }: { item: BankCard }) => {
    const isCredit = item.type === 'credit';
    const isNapas = item.network === 'napas';
    const isLocked = item.status === 'locked';
    const isLost = item.status === 'lost';

    return (
      <View style={[styles.cardItemWrapper, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        <View
          style={[
            styles.cardFace,
            isCredit ? styles.cardFaceCredit : isNapas ? styles.cardFaceNapas : styles.cardFaceDebit,
          ]}
        >
          {/* Subtle sheen highlight */}
          <View style={styles.cardSheen} pointerEvents="none" />

          {/* Top row: Brand & Type & Contactless */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardBrandGroup}>
              <Text style={styles.cardBrandText}>MAUVE</Text>
              <View style={[styles.cardTypeBadge, isCredit && styles.cardTypeBadgeCredit]}>
                <Text style={styles.cardTypeBadgeText}>
                  {item.type === 'credit' ? 'INFINITE CREDIT' : isNapas ? 'SMART DEBIT' : 'PLATINUM DEBIT'}
                </Text>
              </View>
            </View>
            <View style={styles.contactlessIconBox}>
              <Wifi size={18} color="rgba(240, 217, 228, 0.75)" strokeWidth={2} style={styles.wifiRotated} />
            </View>
          </View>

          {/* Middle row: EMV Chip & Status */}
          <View style={styles.cardMiddleRow}>
            {/* Realistic EMV Chip Graphic */}
            <View style={styles.emvChip}>
              <View style={styles.emvChipLineH} />
              <View style={styles.emvChipLineV} />
              <View style={styles.emvChipCore} />
            </View>

            {/* Status Pill on Card */}
            {isLocked && (
              <View style={styles.cardStatusPillLocked}>
                <Lock size={12} color={Palette.warning} strokeWidth={2} />
                <Text style={styles.cardStatusPillTextLocked}>ĐÃ KHÓA</Text>
              </View>
            )}

            {isLost && (
              <View style={styles.cardStatusPillLost}>
                <AlertTriangle size={12} color={Palette.error} strokeWidth={2} />
                <Text style={styles.cardStatusPillTextLost}>ĐÃ BÁO MẤT</Text>
              </View>
            )}

            {!isLocked && !isLost && (
              <View style={styles.cardStatusPillActive}>
                <View style={styles.statusDotActive} />
                <Text style={styles.cardStatusPillTextActive}>HOẠT ĐỘNG</Text>
              </View>
            )}
          </View>

          {/* Bottom section: Card Number, Holder, Expiry, Network */}
          <View style={styles.cardBottomRow}>
            <View style={styles.cardDetailsLeft}>
              <Text style={styles.cardNumberText}>{item.maskedNumber}</Text>
              <View style={styles.cardHolderRow}>
                <View>
                  <Text style={styles.cardMetaLabel}>CHỦ THẺ</Text>
                  <Text style={styles.cardHolderName} numberOfLines={1}>
                    {item.cardholderName}
                  </Text>
                </View>
                <View style={styles.cardExpiryBox}>
                  <Text style={styles.cardMetaLabel}>HẾT HẠN</Text>
                  <Text style={styles.cardExpiryText}>{item.expiry}</Text>
                </View>
              </View>
            </View>

            {/* Network Logo */}
            <View style={styles.cardNetworkBox}>
              {item.network === 'visa' && (
                <Text style={styles.visaWordmark}>VISA</Text>
              )}
              {item.network === 'mastercard' && (
                <View style={styles.mcCircles}>
                  <View style={styles.mcCircleRed} />
                  <View style={styles.mcCircleOrange} />
                </View>
              )}
              {item.network === 'napas' && (
                <View style={styles.napasBox}>
                  <Text style={styles.napasText}>napas</Text>
                </View>
              )}
            </View>
          </View>

          {/* Frozen / Disabled Overlay if locked or lost */}
          {(isLocked || isLost) && (
            <View style={[styles.cardFrozenOverlay, isLost && styles.cardLostOverlay]} pointerEvents="none" />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: Palette.bg }]}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader title="Quản lý thẻ" onBack={onClose} />

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card Carousel (Full Screen Width) ── */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={cardListRef}
            data={cards}
            keyExtractor={(item) => item.id}
            renderItem={renderCardItem}
            ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.carouselListContent}
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH + CARD_GAP,
              offset: (CARD_WIDTH + CARD_GAP) * index,
              index,
            })}
            onMomentumScrollEnd={handleScrollEnd}
          />

          {/* Carousel Pagination Dots */}
          <View style={styles.paginationRow}>
            {cards.map((c, idx) => {
              const isActive = idx === selectedCardIndex;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    cardListRef.current?.scrollToOffset({
                      offset: idx * (CARD_WIDTH + CARD_GAP),
                      animated: true,
                    });
                    setSelectedCardIndex(idx);
                    setIsDetailsRevealedModalOpen(false);
                  }}
                  hitSlop={8}
                  style={[styles.paginationDot, isActive && styles.paginationDotActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn ${c.cardName}`}
                />
              );
            })}
          </View>
        </View>

        {/* ── Screen Body Content (Padded) ── */}
        <View style={styles.bodyContent}>
          {/* ── Card Overview & Linked Account Card ── */}
          <View style={styles.section}>
            <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.overviewCard}>
              <View style={styles.cardNameRow}>
                <View style={styles.cardNameLeft}>
                  <View style={styles.cardNameIconBox}>
                    <CreditCard size={18} color={Palette.secondary} strokeWidth={1.75} />
                  </View>
                  <Text style={styles.cardNameText}>{selectedCard.cardName}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    selectedCard.status === 'active'
                      ? styles.statusBadgeActive
                      : selectedCard.status === 'locked'
                      ? styles.statusBadgeLocked
                      : styles.statusBadgeLost,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      selectedCard.status === 'active'
                        ? styles.statusTextActive
                        : selectedCard.status === 'locked'
                        ? styles.statusTextLocked
                        : styles.statusTextLost,
                    ]}
                  >
                    {getCardStatusLabel(selectedCard.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ── Linked Account Section (Responsive Vertical Hierarchy) ── */}
              <View style={styles.linkedAccountBlock}>
                <Text style={styles.metaLabel}>
                  {selectedCard.type === 'credit' ? 'Tài khoản tín dụng' : 'Tài khoản liên kết'}
                </Text>
                <Text style={styles.accountNameText} numberOfLines={2}>
                  {linkedAccount?.accountName || (selectedCard.type === 'credit' ? 'Thẻ Tín dụng Infinite' : 'Tài khoản chính')}
                </Text>
                <Text style={styles.accountNumberText}>
                  {linkedAccount ? maskAccountNumber(linkedAccount.accountNumber) : '•••• •••• ••••'}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* ── Financial Details (Clearly Labeled Separate Rows) ── */}
              {selectedCard.type === 'credit' ? (
                <>
                  {/* Credit Limit */}
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Hạn mức tín dụng</Text>
                    <Text style={styles.financialValueAmount}>
                      {formatVND(selectedCard.creditLimit || 0)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Available Credit Limit */}
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Hạn mức khả dụng</Text>
                    <Text style={[styles.financialValueAmount, { color: Palette.incomeGreen }]}>
                      {formatVND(selectedCard.availableLimit || 0)}
                    </Text>
                  </View>

                  {/* Outstanding Balance if present */}
                  {linkedAccount && typeof linkedAccount.balance === 'number' && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>Dư nợ hiện tại</Text>
                        <Text style={[styles.financialValueAmount, { color: Palette.warning }]}>
                          {formatVND(Math.abs(linkedAccount.balance))}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              ) : (
                /* Debit / Napas Available Balance */
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Số dư khả dụng</Text>
                  <Text style={styles.financialValueAmount}>
                    {linkedAccount ? formatVND(linkedAccount.balance) : '0 đ'}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Daily Spending Limit Row */}
              <View style={styles.financialRow}>
                <View style={styles.limitInfo}>
                  <Text style={styles.financialLabel}>Hạn mức chi tiêu ngày</Text>
                  <Text style={styles.financialValue}>{formatVND(selectedCard.dailyLimit)} / ngày</Text>
                </View>
                <Pressable
                  onPress={handleOpenLimitModal}
                  style={({ pressed }) => [styles.smallActionBtn, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Đổi hạn mức ngày"
                >
                  <Text style={styles.smallActionBtnText}>Đổi hạn mức</Text>
                </Pressable>
              </View>
            </GlassView>
          </View>

        {/* ── 4 Primary Quick Action Buttons ── */}
        <View style={styles.quickGrid}>
          {/* Lock / Unlock */}
          <Pressable
            onPress={handleLockUnlockPress}
            style={({ pressed }) => [styles.quickTile, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel={selectedCard.status === 'locked' ? 'Mở khóa thẻ' : 'Khóa thẻ tạm thời'}
          >
            <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.quickTileInner}>
              <View
                style={[
                  styles.quickTileIconBox,
                  selectedCard.status === 'locked' && { backgroundColor: 'rgba(255, 149, 0, 0.15)' },
                ]}
              >
                {selectedCard.status === 'locked' ? (
                  <Unlock size={20} color={Palette.warning} strokeWidth={1.75} />
                ) : (
                  <Lock size={20} color={Palette.light} strokeWidth={1.75} />
                )}
              </View>
              <Text style={styles.quickTileLabel}>
                {selectedCard.status === 'locked' ? 'Mở khóa thẻ' : 'Khóa thẻ'}
              </Text>
            </GlassView>
          </Pressable>

          {/* View Card Details */}
          <Pressable
            onPress={handleOpenDetails}
            style={({ pressed }) => [styles.quickTile, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Xem thông tin thẻ"
          >
            <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.quickTileInner}>
              <View style={styles.quickTileIconBox}>
                <Eye size={20} color={Palette.light} strokeWidth={1.75} />
              </View>
              <Text style={styles.quickTileLabel}>Thông tin thẻ</Text>
            </GlassView>
          </Pressable>

          {/* Change Daily Limit */}
          <Pressable
            onPress={handleOpenLimitModal}
            style={({ pressed }) => [styles.quickTile, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cài đặt hạn mức"
          >
            <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.quickTileInner}>
              <View style={styles.quickTileIconBox}>
                <Sliders size={20} color={Palette.light} strokeWidth={1.75} />
              </View>
              <Text style={styles.quickTileLabel}>Hạn mức</Text>
            </GlassView>
          </Pressable>

          {/* Report Lost Card */}
          <Pressable
            onPress={handleReportLostPress}
            style={({ pressed }) => [styles.quickTile, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Báo mất thẻ"
          >
            <GlassView variant="subtle" borderRadius={Radius.lg} style={styles.quickTileInner}>
              <View
                style={[
                  styles.quickTileIconBox,
                  selectedCard.status === 'lost' && { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
                ]}
              >
                <AlertTriangle
                  size={20}
                  color={selectedCard.status === 'lost' ? Palette.error : Palette.secondary}
                  strokeWidth={1.75}
                />
              </View>
              <Text style={[styles.quickTileLabel, selectedCard.status === 'lost' && { color: Palette.error }]}>
                {selectedCard.status === 'lost' ? 'Đã báo mất' : 'Báo mất thẻ'}
              </Text>
            </GlassView>
          </Pressable>
        </View>

        {/* ── Transaction Controls (Switches) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt giao dịch</Text>

          {selectedCard.status !== 'active' && (
            <View style={styles.lockedNoticeBanner}>
              <Info size={15} color={Palette.warning} strokeWidth={1.75} />
              <Text style={styles.lockedNoticeText}>
                {selectedCard.status === 'locked'
                  ? 'Thẻ đang tạm khóa. Mọi cài đặt giao dịch đang tạm ngưng hiệu lực.'
                  : 'Thẻ đã báo mất vĩnh viễn. Không thể bật tính năng giao dịch.'}
              </Text>
            </View>
          )}

          <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={styles.switchesCard}>
            {/* 1. Online Payments */}
            <View style={styles.switchRow}>
              <View style={styles.switchIconBox}>
                <ShoppingCart size={18} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Thanh toán trực tuyến</Text>
                <Text style={styles.switchSubtitle}>Chi tiêu mua sắm online, ứng dụng và ví điện tử</Text>
              </View>
              <Switch
                value={selectedCard.onlinePaymentsEnabled}
                onValueChange={handleToggleOnline}
                disabled={selectedCard.status !== 'active'}
                trackColor={{ false: 'rgba(128, 108, 121, 0.25)', true: Palette.primary }}
                thumbColor={selectedCard.onlinePaymentsEnabled ? Palette.light : Palette.gray400}
                ios_backgroundColor="rgba(128, 108, 121, 0.25)"
              />
            </View>

            <View style={styles.divider} />

            {/* 2. International Transactions */}
            <View style={styles.switchRow}>
              <View style={styles.switchIconBox}>
                <Globe size={18} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Giao dịch quốc tế</Text>
                <Text style={styles.switchSubtitle}>
                  {selectedCard.network === 'napas'
                    ? 'Thẻ nội địa không áp dụng giao dịch nước ngoài'
                    : 'Thanh toán ngoại tệ và chi tiêu tại nước ngoài'}
                </Text>
              </View>
              <Switch
                value={selectedCard.internationalPaymentsEnabled}
                onValueChange={handleToggleInternational}
                disabled={selectedCard.status !== 'active' || selectedCard.network === 'napas'}
                trackColor={{ false: 'rgba(128, 108, 121, 0.25)', true: Palette.primary }}
                thumbColor={selectedCard.internationalPaymentsEnabled ? Palette.light : Palette.gray400}
                ios_backgroundColor="rgba(128, 108, 121, 0.25)"
              />
            </View>

            <View style={styles.divider} />

            {/* 3. Contactless Payments */}
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchIconBox}>
                <Wifi size={18} color={Palette.secondary} strokeWidth={1.75} />
              </View>
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Thanh toán không tiếp xúc</Text>
                <Text style={styles.switchSubtitle}>Chạm thẻ thanh toán nhanh tại các máy POS</Text>
              </View>
              <Switch
                value={selectedCard.contactlessEnabled}
                onValueChange={handleToggleContactless}
                disabled={selectedCard.status !== 'active'}
                trackColor={{ false: 'rgba(128, 108, 121, 0.25)', true: Palette.primary }}
                thumbColor={selectedCard.contactlessEnabled ? Palette.light : Palette.gray400}
                ios_backgroundColor="rgba(128, 108, 121, 0.25)"
              />
            </View>
          </GlassView>
        </View>

        {/* ── Card Transaction History ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Giao dịch qua thẻ</Text>
            {cardTransactions.length > 0 && onOpenHistory && (
              <Pressable
                onPress={() => onOpenHistory(selectedCard.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Xem tất cả giao dịch thẻ"
              >
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </Pressable>
            )}
          </View>

          {cardTransactions.length === 0 ? (
            /* Empty State */
            <GlassView variant="card" borderRadius={Radius.lg} luminousBorder style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <CreditCard size={28} color={Palette.secondary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có giao dịch thẻ</Text>
              <Text style={styles.emptySubtitle}>
                Thẻ này chưa ghi nhận giao dịch nào gần đây.
              </Text>
            </GlassView>
          ) : (
            /* Card Transactions List */
            <View style={styles.txList}>
              {cardTransactions.slice(0, 5).map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  isLast={idx === Math.min(cardTransactions.length, 5) - 1}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Lock Card Confirmation Sheet                                   */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmationBottomSheet
        visible={isLockModalOpen}
        title="Khóa thẻ tạm thời?"
        message={`Thẻ ${selectedCard.cardName} (${selectedCard.maskedNumber}) sẽ bị tạm khóa. Mọi giao dịch phát sinh qua thẻ sẽ bị từ chối cho đến khi bạn mở khóa lại.`}
        confirmLabel="Khóa thẻ"
        cancelLabel="Hủy bỏ"
        variant="warning"
        icon={Lock}
        onConfirm={confirmLockCard}
        onCancel={() => setIsLockModalOpen(false)}
      />

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Demo Verification Modal Before Viewing Details                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isDetailsVerifyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDetailsVerifyModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.dialogCard}>
            <View style={styles.dialogIconBoxPrimary}>
              <ShieldCheck size={28} color={Palette.light} strokeWidth={1.75} />
            </View>
            <Text style={styles.dialogTitle}>Xác thực bảo mật</Text>

            {/* Clear Demo Indicator Notice */}
            <View style={styles.demoNoticeTag}>
              <Text style={styles.demoNoticeTagText}>⚠️ MÔ PHỎNG THỬ NGHIỆM (DEMO)</Text>
            </View>

            <Text style={styles.dialogMessage}>
              Vui lòng xác thực sinh trắc học để hiển thị số thẻ đầy đủ và mã bảo mật CVV. Đây là bước xác thực mô phỏng bảo mật của ứng dụng.
            </Text>

            <View style={styles.dialogButtonsRow}>
              <Pressable
                onPress={() => setIsDetailsVerifyModalOpen(false)}
                style={styles.dialogCancelBtn}
                accessibilityRole="button"
                accessibilityLabel="Hủy"
              >
                <Text style={styles.dialogCancelText}>Đóng</Text>
              </Pressable>
              <Pressable
                onPress={handleVerifyDemoSuccess}
                style={styles.dialogConfirmBtnPrimary}
                accessibilityRole="button"
                accessibilityLabel="Xác thực Face ID"
              >
                <Text style={styles.dialogConfirmText}>Xác thực mô phỏng</Text>
              </Pressable>
            </View>
          </GlassView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Revealed Card Details Modal                                    */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isDetailsRevealedModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailsRevealedModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.detailsModalCard}>
            <View style={styles.detailsModalHeader}>
              <View>
                <Text style={styles.detailsModalTitle}>Thông tin thẻ</Text>
                <Text style={styles.detailsModalSubtitle}>{selectedCard.cardName}</Text>
              </View>
              <Pressable
                onPress={() => setIsDetailsRevealedModalOpen(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng thông tin thẻ"
              >
                <X size={20} color={Palette.light} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Warning note */}
            <View style={styles.securityWarningBox}>
              <Info size={14} color={Palette.warning} strokeWidth={1.75} />
              <Text style={styles.securityWarningText}>
                Tuyệt đối không chia sẻ mã CVV với bất kỳ ai để bảo vệ an toàn cho thẻ của bạn.
              </Text>
            </View>

            {/* Full Card Number with Copy */}
            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailFieldLabel}>SỐ THẺ ĐẦY ĐỦ</Text>
                <Text style={styles.detailFieldValueCardNumber}>
                  {selectedCard.demoDetails?.fullCardNumber || selectedCard.maskedNumber}
                </Text>
              </View>
              <Pressable
                onPress={handleCopyCardNumber}
                style={styles.copyBtn}
                accessibilityRole="button"
                accessibilityLabel="Sao chép số thẻ"
              >
                {copyFeedback ? (
                  <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={2} />
                ) : (
                  <Copy size={18} color={Palette.secondary} strokeWidth={1.75} />
                )}
                <Text style={[styles.copyBtnText, copyFeedback && { color: Palette.incomeGreen }]}>
                  {copyFeedback ? 'Đã chép' : 'Sao chép'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Cardholder */}
            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailFieldLabel}>TÊN CHỦ THẺ</Text>
                <Text style={styles.detailFieldValue}>{selectedCard.cardholderName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Expiry & CVV */}
            <View style={styles.detailTwoColRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailFieldLabel}>NGÀY HẾT HẠN</Text>
                <Text style={styles.detailFieldValue}>{selectedCard.expiry}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailFieldLabel}>MÃ BẢO MẬT (CVV)</Text>
                <View style={styles.cvvBox}>
                  <Text style={styles.cvvText}>{selectedCard.demoDetails?.cvv || '•••'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Action to dismiss */}
            <Pressable
              onPress={() => setIsDetailsRevealedModalOpen(false)}
              style={styles.detailsCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng và ẩn thông tin"
            >
              <Text style={styles.detailsCloseBtnText}>Đóng & Ẩn thông tin</Text>
            </Pressable>
          </GlassView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: Change Spending Limit Modal                                    */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isLimitModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLimitModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassView variant="card" borderRadius={Radius.xl} luminousBorder style={styles.limitModalCard}>
            <View style={styles.detailsModalHeader}>
              <View>
                <Text style={styles.detailsModalTitle}>Hạn mức chi tiêu ngày</Text>
                <Text style={styles.detailsModalSubtitle}>{selectedCard.cardName}</Text>
              </View>
              <Pressable
                onPress={() => setIsLimitModalOpen(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <X size={20} color={Palette.light} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Current Limit Display */}
            <View style={styles.currentLimitBox}>
              <Text style={styles.currentLimitLabel}>Hạn mức hiện tại</Text>
              <Text style={styles.currentLimitValue}>{formatVND(selectedCard.dailyLimit)} / ngày</Text>
            </View>

            {/* Input field */}
            <View style={styles.limitInputWrapper}>
              <Text style={styles.limitInputLabel}>Nhập hạn mức mới (VND)</Text>
              <TextInput
                value={newLimitInput}
                onChangeText={(val) => {
                  setNewLimitInput(formatVNDInput(val));
                  setLimitError('');
                }}
                keyboardType="number-pad"
                placeholder="Nhập số tiền"
                placeholderTextColor={Palette.gray500}
                style={styles.limitInput}
              />
              {limitError.length > 0 && <Text style={styles.limitErrorText}>{limitError}</Text>}
              <Text style={styles.limitRangeHint}>
                Tối thiểu: {formatVND(selectedCard.minDailyLimit)} · Tối đa: {formatVND(selectedCard.maxDailyLimit)}
              </Text>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {[10000000, 20000000, 50000000, 100000000].map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => handlePresetLimit(preset)}
                  style={[
                    styles.presetChip,
                    parseVNDInput(newLimitInput) === preset && styles.presetChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${preset / 1000000} triệu`}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      parseVNDInput(newLimitInput) === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset >= 1000000 ? `${preset / 1000000} triệu` : formatVND(preset)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSaveLimit}
              style={styles.saveLimitBtn}
              accessibilityRole="button"
              accessibilityLabel="Lưu hạn mức"
            >
              <Text style={styles.saveLimitBtnText}>Lưu hạn mức mới</Text>
            </Pressable>
          </GlassView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: Report Lost Card Confirmation Sheet                            */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmationBottomSheet
        visible={isLostModalOpen}
        title="Xác nhận báo mất thẻ?"
        message={`Thẻ ${selectedCard.cardName} (${selectedCard.maskedNumber}) sẽ bị vô hiệu hóa hoàn toàn ngay lập tức và không thể kích hoạt lại qua ứng dụng.\n\nSau khi báo mất, vui lòng gọi Tổng đài 1900 8829 hoặc đến chi nhánh Mauve Banking gần nhất để yêu cầu phát hành thẻ mới.`}
        confirmLabel="Báo mất ngay"
        cancelLabel="Quay lại"
        variant="danger"
        icon={AlertTriangle}
        onConfirm={confirmReportLost}
        onCancel={() => setIsLostModalOpen(false)}
      />

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Standardized Feedback Dialog                                            */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <FeedbackDialog
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((prev) => ({ ...prev, visible: false }))}
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

  // ── Scroll Content ──────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    // Root scrollable body; horizontal padding moved to bodyContent
  },
  bodyContent: {
    paddingHorizontal: Spacing.xl,
  },

  // ── Carousel Container ──────────────────────
  carouselContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  carouselListContent: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: CARD_SIDE_PADDING,
  },
  cardItemWrapper: {
    borderRadius: Radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  cardFace: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },

  // Card Variant Backgrounds
  cardFaceDebit: {
    backgroundColor: '#27202F',
    borderColor: 'rgba(193, 160, 172, 0.35)',
  },
  cardFaceCredit: {
    backgroundColor: '#191522',
    borderColor: 'rgba(212, 175, 55, 0.45)', // subtle champagne gold border
  },
  cardFaceNapas: {
    backgroundColor: '#201C27',
    borderColor: 'rgba(160, 170, 193, 0.35)',
  },
  cardSheen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },

  // Card Internal Layout
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardBrandText: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.white,
    letterSpacing: 2,
  },
  cardTypeBadge: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(193, 160, 172, 0.3)',
  },
  cardTypeBadgeCredit: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.light,
    letterSpacing: 0.8,
  },
  contactlessIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiRotated: {
    transform: [{ rotate: '90deg' }],
  },

  // Middle Row: Chip & Status
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  emvChip: {
    width: 40,
    height: 28,
    backgroundColor: '#D1A858',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#B88E3E',
    position: 'relative',
    overflow: 'hidden',
  },
  emvChipLineH: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#9A742A',
  },
  emvChipLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 19,
    width: 1,
    backgroundColor: '#9A742A',
  },
  emvChipCore: {
    position: 'absolute',
    top: 7,
    left: 11,
    width: 18,
    height: 14,
    borderRadius: 3,
    borderWidth: 0.75,
    borderColor: '#9A742A',
  },

  // Status Pills on Card
  cardStatusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(50, 215, 75, 0.3)',
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.incomeGreen,
  },
  cardStatusPillTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.incomeGreen,
    letterSpacing: 0.5,
  },
  cardStatusPillLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 149, 0, 0.4)',
  },
  cardStatusPillTextLocked: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.warning,
    letterSpacing: 0.5,
  },
  cardStatusPillLost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  cardStatusPillTextLost: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.error,
    letterSpacing: 0.5,
  },

  // Bottom Area of Card
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDetailsLeft: {
    flex: 1,
  },
  cardNumberText: {
    fontSize: 17,
    fontWeight: '600',
    color: Palette.white,
    letterSpacing: 2.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: Spacing.xs,
  },
  cardHolderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.lg,
  },
  cardMetaLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Palette.secondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.light,
    letterSpacing: 1,
  },
  cardExpiryBox: {},
  cardExpiryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.light,
    letterSpacing: 1,
  },
  cardNetworkBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  visaWordmark: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Palette.white,
    letterSpacing: 1.5,
  },
  mcCircles: {
    flexDirection: 'row',
    width: 38,
    height: 24,
    position: 'relative',
  },
  mcCircleRed: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EB001B',
    position: 'absolute',
    left: 0,
  },
  mcCircleOrange: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(247, 158, 27, 0.9)',
    position: 'absolute',
    right: 0,
  },
  napasBox: {
    backgroundColor: '#005BAA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  napasText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  // Frozen / Lost Overlay
  cardFrozenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 8, 14, 0.45)',
  },
  cardLostOverlay: {
    backgroundColor: 'rgba(30, 10, 12, 0.65)',
  },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(193, 160, 172, 0.25)',
  },
  paginationDotActive: {
    width: 22,
    backgroundColor: Palette.light,
  },

  // ── Sections & Cards ────────────────────────
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacing.tight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  seeAllText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },

  // Overview Card
  overviewCard: {
    padding: Spacing.lg,
  },
  cardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardNameLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    flex: 1,
  },
  cardNameIconBox: {
    marginTop: 2,
  },
  cardNameText: {
    flex: 1,
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
  },
  statusBadgeLocked: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  statusBadgeLost: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
  },
  statusTextActive: {
    color: Palette.incomeGreen,
  },
  statusTextLocked: {
    color: Palette.warning,
  },
  statusTextLost: {
    color: Palette.error,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    marginVertical: Spacing.md,
  },
  linkedAccountBlock: {
    gap: 4,
  },
  accountNameText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    lineHeight: 20,
  },
  accountNumberText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  financialLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    flexShrink: 1,
  },
  financialValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  financialValueAmount: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  limitInfo: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaValueAmount: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  smallActionBtn: {
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  smallActionBtnText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },

  // ── Quick Tiles Grid ────────────────────────
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickTile: {
    flex: 1,
  },
  quickTileInner: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickTileLabel: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
    textAlign: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },

  // ── Switches Card ───────────────────────────
  lockedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  lockedNoticeText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.warning,
    flex: 1,
  },
  switchesCard: {
    padding: Spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },

  // ── Transaction List & Empty State ──────────
  txList: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    backgroundColor: Palette.surfaceL2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Modal Styles ────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 15, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  dialogCard: {
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  dialogIconBoxWarning: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  dialogIconBoxPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  dialogIconBoxDanger: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  dialogTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  demoNoticeTag: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  demoNoticeTagText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.warning,
  },
  lostWarningTag: {
    backgroundColor: 'rgba(255, 59, 48, 0.18)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  lostWarningTagText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.error,
  },
  dialogMessage: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  dialogHighlight: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.bold,
  },
  lostInstructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
  },
  lostInstructionsText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    flex: 1,
    lineHeight: 18,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
  },
  dialogCancelText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },
  dialogConfirmBtnPrimary: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    backgroundColor: Palette.primary,
  },
  dialogConfirmBtnWarning: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    backgroundColor: Palette.warning,
  },
  dialogConfirmBtnDanger: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    backgroundColor: Palette.error,
  },
  dialogConfirmText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },

  // ── Details Revealed Modal ──────────────────
  detailsModalCard: {
    width: '100%',
    padding: Spacing.xl,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  detailsModalTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  detailsModalSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  securityWarningText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.warning,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTwoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.secondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailFieldValueCardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailFieldValue: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  cvvBox: {
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.3)',
  },
  cvvText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: '700',
    color: Palette.light,
    letterSpacing: 3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  copyBtnText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.light,
    fontWeight: Typography.fontWeight.medium,
  },
  detailsCloseBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    alignItems: 'center',
  },
  detailsCloseBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },

  // ── Spending Limit Modal ────────────────────
  limitModalCard: {
    width: '100%',
    padding: Spacing.xl,
  },
  currentLimitBox: {
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  currentLimitLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: 2,
  },
  currentLimitValue: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  limitInputWrapper: {
    marginBottom: Spacing.lg,
  },
  limitInputLabel: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
    marginBottom: Spacing.xs,
  },
  limitInput: {
    backgroundColor: 'rgba(32, 26, 39, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.3)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Palette.white,
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.bold,
  },
  limitErrorText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.error,
    marginTop: Spacing.xs,
  },
  limitRangeHint: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    marginTop: Spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(128, 108, 121, 0.55)',
    borderColor: Palette.light,
  },
  presetChipText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  presetChipTextActive: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.bold,
  },
  saveLimitBtn: {
    backgroundColor: Palette.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  saveLimitBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
});
