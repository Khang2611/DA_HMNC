import React, { useState, useEffect, useRef, useMemo, ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Bell } from 'lucide-react-native';
import { BlurTargetView } from 'expo-blur';
import { AnimatedSplashScreen } from './src/components/splash/AnimatedSplashScreen';
import { AuthTransitionNavigator } from './src/components/auth/AuthTransitionNavigator';
import { QuickAuthOverlay } from './src/components/QuickAuthOverlay';
import { LockedHomeShell } from './src/components/LockedHomeShell';
import { useAppLaunchFlow } from './src/hooks/useAppLaunchFlow';
import { Palette, Typography, Spacing, Radius } from './src/theme/tokens';
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS, MOCK_SAVINGS_ACCOUNTS } from './src/data/mockData';
import { AccountCard } from './src/components/AccountCard';
import { QuickActionsGrid } from './src/components/QuickActionsGrid';
import { TransactionItem } from './src/components/TransactionItem';
import { FloatingBottomNav, TabKey } from './src/components/FloatingBottomNav';
import { ChatbotSheet } from './src/components/ChatbotSheet';
import { GlassView } from './src/components/GlassView';
import { ComingSoonModal } from './src/components/ComingSoonModal';
import { FeedbackDialog } from './src/components/FeedbackDialog';
import { TransferMoneyScreen } from './src/screens/TransferMoneyScreen';
import { MobileTopUpScreen } from './src/screens/MobileTopUpScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { ReceiveQRScreen } from './src/screens/ReceiveQRScreen';
import { SavingsScreen } from './src/screens/SavingsScreen';
import { ProductCatalogScreen } from './src/screens/ProductCatalogScreen';
import { CustomizeScreen } from './src/screens/CustomizeScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { TransactionHistoryScreen } from './src/screens/TransactionHistoryScreen';
import { BillPaymentScreen } from './src/screens/BillPaymentScreen';
import { CardManagementScreen } from './src/screens/CardManagementScreen';
import { FinancialManagementScreen } from './src/screens/FinancialManagementScreen';
import { EWalletTopUpScreen, EWalletPaymentPayload } from './src/screens/EWalletTopUpScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FinanceState } from './src/types/finance';
import { UserProfile, SettingsPreferences } from './src/types/settings';
import {
  INITIAL_USER_PROFILE,
  DEFAULT_SETTINGS_PREFERENCES,
  loadUserProfile,
  saveUserProfile,
  loadSettingsPreferences,
  saveSettingsPreferences,
} from './src/data/mockUser';
import { MOCK_INVOICES, BillInvoice } from './src/data/mockBills';
import { MOCK_CARDS } from './src/data/mockCards';
import { TransferPayload, Transaction, SavingsAccount, BankCard } from './src/types/banking';
import {
  ProductId,
  PRODUCT_MAP,
  DEFAULT_QUICK_ACTION_IDS,
  sanitizeQuickActionIds,
} from './src/data/products';
import { loadQuickActionIds, saveQuickActionIds } from './src/utils/quickActionPrefs';
// ─────────────────────────────────────────────
// Inner screen: uses safe-area insets directly
// ─────────────────────────────────────────────
function HomeScreen({ onSignOut }: { onSignOut?: () => void }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isReceiveQROpen, setIsReceiveQROpen] = useState(false);
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBillPaymentOpen, setIsBillPaymentOpen] = useState(false);
  const [isCardsOpen, setIsCardsOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isEWalletOpen, setIsEWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
  const [settingsInitialPage, setSettingsInitialPage] =
    useState<'main' | 'profile'>('main');
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [settingsPrefs, setSettingsPrefs] = useState<SettingsPreferences>(DEFAULT_SETTINGS_PREFERENCES);
  const [financeState, setFinanceState] = useState<FinanceState>({
    categoryOverrides: [],
    budgets: [],
    savingsGoals: [],
    recurringExpenses: [],
  });
  const [historyInitialAccountId, setHistoryInitialAccountId] = useState<string | undefined>(undefined);
  const [historyInitialCardId, setHistoryInitialCardId] = useState<string | undefined>(undefined);
  // Coming Soon — for home quick action taps on unavailable products
  const [comingSoonId, setComingSoonId] = useState<ProductId | null>(null);
  // Quick action IDs — 4 always.
  // `prefsLoaded` prevents a momentary flash of defaults before AsyncStorage
  // returns the user's saved selection.
  const [quickActionIds, setQuickActionIds] = useState<ProductId[]>(
    sanitizeQuickActionIds(DEFAULT_QUICK_ACTION_IDS)
  );
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  // Restore persisted preferences on mount
  useEffect(() => {
    let cancelled = false;
    loadQuickActionIds().then((ids) => {
      if (!cancelled) {
        setQuickActionIds(ids);
        setPrefsLoaded(true);
      }
    });
    loadUserProfile().then((profile) => {
      if (!cancelled) {
        setUserProfile(profile);
      }
    });
    loadSettingsPreferences().then((prefs) => {
      if (!cancelled) {
        setSettingsPrefs(prefs);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleUpdateSettingsPreferences = (updated: SettingsPreferences) => {
    setSettingsPrefs(updated);
    saveSettingsPreferences(updated);
  };
  // Dynamic state for accounts and transactions to reflect transfer balance deduction
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>(MOCK_SAVINGS_ACCOUNTS);
  const [invoices, setInvoices] = useState<BillInvoice[]>(MOCK_INVOICES);
  const [cards, setCards] = useState<BankCard[]>(MOCK_CARDS);
  // References for BlurTargetView to enable native Android hardware blur
  const scrollContentRef = useRef<ComponentRef<typeof View> | null>(null);
  const accountCardBgRef = useRef<ComponentRef<typeof View> | null>(null);
  // Approximate initial midpoint (insets.top + spacing + header + sectionHeader + half card)
  // Ensures zero layout flash before onLayout measurement completes
  const [wavePosition, setWavePosition] = useState(() => insets.top + 250);
  const waveTop = Math.max(0, wavePosition);
  const currentAccount = accounts[selectedAccountIndex] || accounts[0];
  const handleTransferSuccess = (payload: TransferPayload) => {
    // 1. Deduct amount from selected source account
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc, idx) => {
        if (idx === selectedAccountIndex) {
          return {
            ...acc,
            balance: acc.balance - payload.amount,
          };
        }
        return acc;
      })
    );
    // 2. Prepend new transaction to recent transactions list
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      title: `Chuyển tiền cho ${payload.recipientName}`,
      category: 'Chuyển tiền',
      amount: -payload.amount,
      timestamp: 'Vừa xong',
      type: 'transfer_out',
      recipientName: payload.recipientName,
      recipientBank: payload.recipientBank.shortName,
      recipientAccountNumber: payload.recipientAccountNumber,
      note: payload.description,
      accountId: payload.sourceAccountId,
      createdAt: new Date().toISOString(),
      referenceCode: payload.transactionCode || `TRF${Date.now().toString().slice(-8)}`,
      status: 'success',
    };
    setTransactions((prevTx) => [newTx, ...prevTx]);
  };
  const handleTopUpSuccess = (tx: Transaction, sourceAccountId?: string) => {
    // Deduct top-up or data package amount from the selected source account
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc, idx) => {
        const isTarget = sourceAccountId ? acc.id === sourceAccountId : idx === selectedAccountIndex;
        if (isTarget) {
          return { ...acc, balance: acc.balance + tx.amount }; // tx.amount is already negative
        }
        return acc;
      })
    );
    const enrichedTx: Transaction = {
      ...tx,
      accountId: sourceAccountId || tx.accountId || accounts[selectedAccountIndex]?.id,
      createdAt: tx.createdAt || new Date().toISOString(),
      referenceCode: tx.referenceCode || `TOP${Date.now().toString().slice(-8)}`,
      status: tx.status || 'success',
    };
    setTransactions((prevTx) => [enrichedTx, ...prevTx]);
  };
  const handleQrTransferSuccess = (tx: Transaction) => {
    // Deduct QR transfer amount from the currently selected account
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc, idx) => {
        if (idx === selectedAccountIndex) {
          return { ...acc, balance: acc.balance + tx.amount }; // tx.amount is already negative
        }
        return acc;
      })
    );
    const enrichedTx: Transaction = {
      ...tx,
      accountId: tx.accountId || accounts[selectedAccountIndex]?.id,
      createdAt: tx.createdAt || new Date().toISOString(),
      referenceCode: tx.referenceCode || `QR${Date.now().toString().slice(-8)}`,
      status: tx.status || 'success',
    };
    setTransactions((prevTx) => [enrichedTx, ...prevTx]);
  };
  const handleOpenSavingsSuccess = (newSavings: SavingsAccount, tx: Transaction) => {
    // 1. Deduct principal from source account & add to acc_savings total
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === newSavings.sourceAccountId) {
          return { ...acc, balance: acc.balance - newSavings.principal };
        }
        if (acc.id === 'acc_savings') {
          return { ...acc, balance: acc.balance + newSavings.principal };
        }
        return acc;
      })
    );
    // 2. Prepend newly opened savings book to user's list
    setSavingsAccounts((prev) => [newSavings, ...prev]);
    // 3. Prepend transaction to activity stream
    const enrichedTx: Transaction = {
      ...tx,
      accountId: newSavings.sourceAccountId,
      createdAt: tx.createdAt || new Date().toISOString(),
      referenceCode: tx.referenceCode || `SAV${Date.now().toString().slice(-8)}`,
      status: tx.status || 'success',
    };
    setTransactions((prevTx) => [enrichedTx, ...prevTx]);
  };
  const handleSettleSavingsSuccess = (
    savingsId: string,
    payoutAmount: number,
    destinationAccountId: string,
    tx: Transaction
  ) => {
    const targetSavings = savingsAccounts.find((s) => s.id === savingsId);
    const principalToDeduct = targetSavings ? targetSavings.principal : 0;
    // 1. Credit payout to destination checking account & deduct principal from acc_savings
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === destinationAccountId) {
          return { ...acc, balance: acc.balance + payoutAmount };
        }
        if (acc.id === 'acc_savings') {
          return { ...acc, balance: Math.max(0, acc.balance - principalToDeduct) };
        }
        return acc;
      })
    );
    // 2. Update status of savings book to settled
    setSavingsAccounts((prev) =>
      prev.map((s) =>
        s.id === savingsId
          ? {
              ...s,
              status: 'settled',
              settledDate: new Date().toLocaleDateString('vi-VN'),
              settledAmount: payoutAmount,
            }
          : s
      )
    );
    // 3. Prepend settlement credit transaction
    const enrichedTx: Transaction = {
      ...tx,
      accountId: destinationAccountId,
      createdAt: tx.createdAt || new Date().toISOString(),
      referenceCode: tx.referenceCode || `STL${Date.now().toString().slice(-8)}`,
      status: tx.status || 'success',
    };
    setTransactions((prevTx) => [enrichedTx, ...prevTx]);
  };
  const handleBillPaymentSuccess = (payload: {
    invoiceId: string;
    sourceAccountId: string;
    amount: number;
    providerName: string;
    serviceTitle: string;
    customerName: string;
    customerCode: string;
    billingPeriod: string;
    referenceCode: string;
  }) => {
    // 1. Deduct amount from selected source account
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === payload.sourceAccountId) {
          return {
            ...acc,
            balance: acc.balance - payload.amount,
          };
        }
        return acc;
      })
    );
    // 2. Mark invoice as paid in shared state
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === payload.invoiceId
          ? { ...inv, status: 'paid', paidAt: new Date().toLocaleDateString('vi-VN') }
          : inv
      )
    );
    // 3. Prepend transaction to activity stream
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      title: `${payload.serviceTitle} - ${payload.providerName}`,
      category: 'Hóa đơn & Dịch vụ',
      amount: -payload.amount,
      timestamp: 'Vừa xong',
      type: 'payment',
      recipientName: payload.providerName,
      note: `Thanh toán hóa đơn ${payload.customerCode} (${payload.billingPeriod}) · ${payload.customerName}`,
      accountId: payload.sourceAccountId,
      createdAt: new Date().toISOString(),
      referenceCode: payload.referenceCode,
      status: 'success',
    };
    setTransactions((prevTx) => [newTx, ...prevTx]);
  };
  const handleEWalletSuccess = (payload: EWalletPaymentPayload) => {
    // 1. Deduct amount from selected source account
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === payload.sourceAccountId) {
          return {
            ...acc,
            balance: acc.balance - payload.amount,
          };
        }
        return acc;
      })
    );
    // 2. Prepend transaction to activity stream
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      title: `Nạp ${payload.provider.name}`,
      category: 'Ví điện tử',
      amount: -payload.amount,
      timestamp: 'Vừa xong',
      type: 'payment',
      recipientName: `${payload.recipient.name} (${payload.provider.name})`,
      note: `Nạp tiền ${payload.provider.name} - ${payload.recipient.phone} · ${payload.recipient.name}`,
      accountId: payload.sourceAccountId,
      createdAt: new Date().toISOString(),
      referenceCode: payload.referenceCode,
      status: 'success',
    };
    setTransactions((prevTx) => [newTx, ...prevTx]);
  };
  const handleUpdateCard = (updatedCard: BankCard) => {
    setCards((prevCards) =>
      prevCards.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
  };
  const handleOpenCardHistory = (cardId?: string) => {
    setIsCardsOpen(false);
    setHistoryInitialAccountId(undefined);
    setHistoryInitialCardId(cardId);
    setTimeout(() => setIsHistoryOpen(true), 50);
  };
  // ── Navigation routing: open the correct modal for a ProductId ────────────
  const openProduct = (id: ProductId) => {
    const product = PRODUCT_MAP.get(id);
    if (!product) return;
    if (product.status === 'coming_soon') {
      setComingSoonId(id);
      return;
    }
    switch (id) {
      case 'transfer':
        setIsTransferOpen(true);
        break;
      case 'mobile':
        setIsTopUpOpen(true);
        break;
      case 'savings':
        setIsSavingsOpen(true);
        break;
      case 'accounts':
        setIsAccountsOpen(true);
        break;
      case 'history':
        setHistoryInitialAccountId(undefined);
        setHistoryInitialCardId(undefined);
        setIsHistoryOpen(true);
        break;
      case 'bills':
        setIsBillPaymentOpen(true);
        break;
      case 'ewallet':
        setIsEWalletOpen(true);
        break;
      case 'cards':
        setIsCardsOpen(true);
        break;
      case 'analytics':
        setIsFinanceOpen(true);
        break;
      default:
        // Should not reach here for 'available' products without a screen,
        // but guard gracefully
        setComingSoonId(id);
    }
  };
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'chatbot') {
      setIsChatOpen(true);
    } else if (tab === 'products') {
      setIsCatalogOpen(true);
    } else if (tab === 'settings') {
      setSettingsInitialPage('main');
      setIsSettingsOpen(true);
    }
  };
  const handleQrPress = () => {
    setIsQRScannerOpen(true);
  };
  // Bottom spacer must clear nav bar + its bottom inset offset
  const navBottomOffset = Math.max(insets.bottom, Spacing.lg);
  const scrollBottomPad = navBottomOffset + 80; // 80 ≈ nav height + clearance
  return (
    <View style={styles.root}>
      {/* System Status Bar — light icons on dark background */}
      <StatusBar style="light" />
      {/* ── Seamless Scrollable Content wrapped in BlurTargetView for Android ── */}
      <BlurTargetView ref={scrollContentRef} style={[StyleSheet.absoluteFill, { backgroundColor: Palette.bg }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* ── UPPER REGION: Wavy Two-Tone Background with Account Card ── */}
          <View style={styles.topSection}>
            {/* Background layer wrapped in BlurTargetView for Account Card blur */}
            <BlurTargetView
              ref={accountCardBgRef}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: Palette.bg },
                ]}
              >
                <View
                  style={{
                    height: waveTop,
                    backgroundColor: Palette.upperSurface,
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                  }}
                />
              </View>
            </BlurTargetView>
            {/* Foreground Content: Header, Section Title, Account Card */}
            <View style={[styles.topSectionContent, { paddingTop: insets.top + Spacing.sm }]}>
              {/* Header Row */}
              <View style={styles.header}>
                {/* Left: Avatar + Greeting */}
                <Pressable
                  onPress={() => {
                    setSettingsInitialPage('profile');
                    setIsSettingsOpen(true);
                  }}
                  android_ripple={{ color: 'rgba(193, 160, 172, 0.15)', borderless: true, radius: 22 }}
                  style={styles.headerLeft}
                  accessibilityRole="button"
                  accessibilityLabel={`Hồ sơ của ${userProfile.fullName}`}
                >
                  <GlassView variant="card" borderRadius={22} style={styles.avatar}>
                    {userProfile.avatarUrl ? (
                      <Image
                        source={{ uri: userProfile.avatarUrl }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                      />
                    ) : (
                      <Text style={styles.avatarInitial} accessibilityLabel="Ảnh đại diện người dùng">
                        {userProfile.avatarInitial}
                      </Text>
                    )}
                  </GlassView>
                  <View style={styles.headerMeta}>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName} numberOfLines={1}>{userProfile.fullName}</Text>
                  </View>
                </Pressable>
                {/* Right: Minimal Icon Actions (Search -> Notification) */}
                <View style={styles.headerActions}>
                  <Pressable
                    onPress={() => setIsCatalogOpen(true)}
                    android_ripple={{ color: 'rgba(193, 160, 172, 0.15)', borderless: true, radius: 22 }}
                    style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
                    accessibilityLabel="Tìm kiếm"
                    accessibilityRole="button"
                    hitSlop={4}
                  >
                    <Search size={22} color={Palette.light} strokeWidth={1.75} />
                  </Pressable>
                  <Pressable
                    onPress={() => setIsSettingsOpen(true)}
                    android_ripple={{ color: 'rgba(193, 160, 172, 0.15)', borderless: true, radius: 22 }}
                    style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
                    accessibilityLabel="Thông báo"
                    accessibilityRole="button"
                    hitSlop={4}
                  >
                    <Bell size={22} color={Palette.light} strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>
              {/* "Tài khoản & Thẻ" Section Heading */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tài khoản & Thẻ</Text>
                <Pressable
                  onPress={() =>
                    setSelectedAccountIndex((prev) => (prev + 1) % accounts.length)
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Đổi tài khoản"
                >
                  <Text style={styles.sectionAction}>Đổi tài khoản</Text>
                </Pressable>
              </View>
              {/* Account Card wrapper with onLayout to calculate exact 50% midpoint */}
              <View
                onLayout={(e) => {
                  const { y, height } = e.nativeEvent.layout;
                  if (height > 0) {
                    setWavePosition(
                      insets.top + Spacing.sm + y + height * 0.5
                    );
                  }
                }}
              >
                <AccountCard
                  account={currentAccount}
                  blurTarget={accountCardBgRef}
                  defaultHideBalance={settingsPrefs.hideBalanceByDefault}
                />
              </View>
            </View>
          </View>
          {/* ── LOWER REGION: Deep Back in Black Background ── */}
          <View style={styles.lowerRegion}>
            {/* Quick Actions Grid — dynamic 4-slot with Tùy chỉnh */}
            {prefsLoaded && (
              <QuickActionsGrid
                actionIds={quickActionIds}
                onSelectAction={(id) => openProduct(id)}
                onCustomize={() => setIsCustomizeOpen(true)}
              />
            )}
            {/* Transactions Section Header */}
            <View style={[styles.sectionHeader, styles.transactionSectionHeader]}>
              <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
              <Pressable
                onPress={() => {
                  setHistoryInitialAccountId(undefined);
                  setIsHistoryOpen(true);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Xem tất cả giao dịch"
              >
                <Text style={styles.sectionAction}>Xem tất cả</Text>
              </Pressable>
            </View>
            {/* Solid grounding surface for Transaction Rows */}
            <View style={styles.txList}>
              {transactions.map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  isLast={idx === transactions.length - 1}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </BlurTargetView>
      {/* ── Five-Position Floating Bottom Navigation with Raised Center QR ── */}
      <FloatingBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onQrPress={handleQrPress}
        blurTarget={scrollContentRef}
      />
      {/* ── Mauve AI Chat Modal ── */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsChatOpen(false)}
      >
        <ChatbotSheet onClose={() => setIsChatOpen(false)} />
      </Modal>
      {/* ── Transfer Money Modal ── */}
      <Modal
        visible={isTransferOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsTransferOpen(false)}
      >
        <TransferMoneyScreen
          accounts={accounts}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsTransferOpen(false)}
          onTransferSuccess={handleTransferSuccess}
        />
      </Modal>
      {/* ── Mobile Top-Up Modal ── */}
      <Modal
        visible={isTopUpOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsTopUpOpen(false)}
      >
        <MobileTopUpScreen
          accounts={accounts}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsTopUpOpen(false)}
          onTopUpSuccess={handleTopUpSuccess}
        />
      </Modal>
      {/* ── QR Scanner & VietQR Modal ── */}
      <Modal
        visible={isQRScannerOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsQRScannerOpen(false)}
      >
        <QRScannerScreen
          accounts={accounts}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsQRScannerOpen(false)}
          onTransferSuccess={handleQrTransferSuccess}
        />
      </Modal>
      {/* ── Direct Receive QR Modal ── */}
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
      {/* ── Savings Module Modal ── */}
      <Modal
        visible={isSavingsOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsSavingsOpen(false)}
      >
        <SavingsScreen
          accounts={accounts}
          savingsAccounts={savingsAccounts}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsSavingsOpen(false)}
          onOpenSavingsSuccess={handleOpenSavingsSuccess}
          onSettleSavingsSuccess={handleSettleSavingsSuccess}
        />
      </Modal>
      {/* ── Product Catalog Modal ── */}
      <Modal
        visible={isCatalogOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCatalogOpen(false)}
      >
        <ProductCatalogScreen
          visible={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          onNavigate={(id) => {
            setIsCatalogOpen(false);
            // Small delay so catalog slides out before next modal slides in
            setTimeout(() => openProduct(id), 50);
          }}
        />
      </Modal>
      {/* ── Customize Quick Actions Modal ── */}
      <Modal
        visible={isCustomizeOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCustomizeOpen(false)}
      >
        <CustomizeScreen
          initialIds={quickActionIds}
          onSave={(ids) => {
            setQuickActionIds(ids);
            saveQuickActionIds(ids);
            setIsCustomizeOpen(false);
          }}
          onCancel={() => setIsCustomizeOpen(false)}
        />
      </Modal>
      {/* ── Account Management Modal ── */}
      <Modal
        visible={isAccountsOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsAccountsOpen(false)}
      >
        <AccountsScreen
          accounts={accounts}
          transactions={transactions}
          onClose={() => setIsAccountsOpen(false)}
          onOpenTransfer={() => {
            setIsAccountsOpen(false);
            setTimeout(() => setIsTransferOpen(true), 50);
          }}
          onOpenReceiveQR={() => {
            setIsAccountsOpen(false);
            setTimeout(() => setIsReceiveQROpen(true), 50);
          }}
          onOpenHistory={(accountId) => {
            setIsAccountsOpen(false);
            setHistoryInitialAccountId(accountId);
            setTimeout(() => setIsHistoryOpen(true), 50);
          }}
        />
      </Modal>

      {/* ── Transaction History Modal ── */}
      <Modal
        visible={isHistoryOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsHistoryOpen(false);
          setHistoryInitialAccountId(undefined);
          setHistoryInitialCardId(undefined);
        }}
      >
        <TransactionHistoryScreen
          accounts={accounts}
          transactions={transactions}
          initialAccountId={historyInitialAccountId}
          initialCardId={historyInitialCardId}
          onClose={() => {
            setIsHistoryOpen(false);
            setHistoryInitialAccountId(undefined);
            setHistoryInitialCardId(undefined);
          }}
        />
      </Modal>
      {/* ── Bill Payment Modal ── */}
      <Modal
        visible={isBillPaymentOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsBillPaymentOpen(false)}
      >
        <BillPaymentScreen
          visible={isBillPaymentOpen}
          accounts={accounts}
          invoices={invoices}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsBillPaymentOpen(false)}
          onPaymentSuccess={handleBillPaymentSuccess}
        />
      </Modal>
      {/* ── Card Management Modal ── */}
      <Modal
        visible={isCardsOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCardsOpen(false)}
      >
        <CardManagementScreen
          visible={isCardsOpen}
          cards={cards}
          accounts={accounts}
          transactions={transactions}
          onClose={() => setIsCardsOpen(false)}
          onUpdateCard={handleUpdateCard}
          onOpenHistory={handleOpenCardHistory}
        />
      </Modal>
      {/* ── Financial Management Modal ── */}
      <Modal
        visible={isFinanceOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFinanceOpen(false)}
      >
        <FinancialManagementScreen
          transactions={transactions}
          accounts={accounts}
          savingsAccounts={savingsAccounts}
          financeState={financeState}
          onUpdateFinanceState={setFinanceState}
          onClose={() => setIsFinanceOpen(false)}
        />
      </Modal>
      {/* ── E-Wallet Top-Up Modal ── */}
      <Modal
        visible={isEWalletOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsEWalletOpen(false)}
      >
        <EWalletTopUpScreen
          visible={isEWalletOpen}
          accounts={accounts}
          initialAccountIndex={selectedAccountIndex}
          onClose={() => setIsEWalletOpen(false)}
          onTopUpSuccess={handleEWalletSuccess}
        />
      </Modal>
      {/* ── Profile & Settings Modal ── */}
      <Modal
        visible={isSettingsOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsSettingsOpen(false);
          setActiveTab('home');
        }}
      >
        <SettingsScreen
          initialPage={settingsInitialPage}
          visible={isSettingsOpen}
          accounts={accounts}
          userProfile={userProfile}
          preferences={settingsPrefs}
          onUpdateUserProfile={handleUpdateUserProfile}
          onUpdatePreferences={handleUpdateSettingsPreferences}
          onOpenChatbot={() => {
            setIsSettingsOpen(false);
            setActiveTab('chatbot');
            setTimeout(() => setIsChatOpen(true), 50);
          }}
          onClose={() => {
            setIsSettingsOpen(false);
            setActiveTab('home');
          }}
          onSignOut={() => {
            setIsSettingsOpen(false);
            setActiveTab('home');
            setIsSignOutSuccessOpen(true);
            // Trigger the app-level sign-out to show auth screen
            setTimeout(() => onSignOut?.(), 1200);
          }}
        />
      </Modal>
      {/* ── Sign Out Success Dialog ── */}
      <FeedbackDialog
        visible={isSignOutSuccessOpen}
        variant="success"
        title="Đăng xuất thành công"
        message="Bạn đã đăng xuất khỏi phiên làm việc hiện tại."
        onClose={() => setIsSignOutSuccessOpen(false)}
      />
      {/* ── Coming Soon Modal (for home quick action taps on unavailable products) ── */}
      <ComingSoonModal
        visible={comingSoonId !== null}
        productName={comingSoonId ? PRODUCT_MAP.get(comingSoonId)?.label : undefined}
        onClose={() => setComingSoonId(null)}
      />
    </View>
  );
}
// ─────────────────────────────────────────────
// AuthenticatedHomeScreenWrapper: Smooth fade + scale-up handoff into Home
// ─────────────────────────────────────────────
function AuthenticatedHomeScreenWrapper({ onSignOut }: { onSignOut: () => void }) {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(1.02), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.2, 0.0, 0.0, 1.0),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.2, 0.0, 0.0, 1.0),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <HomeScreen onSignOut={onSignOut} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Root: wraps in SafeAreaProvider (required for useSafeAreaInsets)
// ─────────────────────────────────────────────
export default function App() {
  const {
    authState,
    currentScreen,
    isSplashDismissed,
    onLogoComplete,
    onSplashDismissed,
    onAuthSuccess,
    onSignOut,
    onLockSession,
  } = useAppLaunchFlow();

  return (
    <SafeAreaProvider>
      <View style={appStyles.appRoot}>
        {/* ── Authenticated State: Live HomeScreen ONLY when authenticated ── */}
        {authState === 'authenticated' && currentScreen === 'home' && (
          <AuthenticatedHomeScreenWrapper
            onSignOut={() => {
              onLockSession();
              onSignOut();
            }}
          />
        )}

        {/* ── Locked State: Safe LockedHomeShell + QuickAuthOverlay (Zero real data) ── */}
        {authState === 'locked' && (
          <>
            <LockedHomeShell />
            <QuickAuthOverlay
              visible={currentScreen === 'locked_home'}
              userName="Quý Nguyễn"
              onAuthSuccess={onAuthSuccess}
              onSignOut={onSignOut}
            />
          </>
        )}

        {/* ── Guest State: Welcome / SignIn / SignUp ONLY (HomeScreen NEVER mounted) ── */}
        {authState === 'guest' && (
          <AuthTransitionNavigator
            initialScreen={
              currentScreen === 'sign_in'
                ? 'sign_in'
                : currentScreen === 'sign_up'
                ? 'sign_up'
                : 'welcome'
            }
            onAuthSuccess={onAuthSuccess}
          />
        )}

        {/* ── Animated Splash: Always on top until fully dismissed ── */}
        {!isSplashDismissed && (
          <AnimatedSplashScreen
            onLogoComplete={onLogoComplete}
            onDismissed={onSplashDismissed}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const appStyles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
});
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg, // Back in Black #16131F
  },
  // ── Scroll View ──────────────────────────────
  scrollView: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollContent: {
    paddingTop: 0,
  },
  // ── Upper Region: Wavy Two-Tone Background ───
  topSection: {
    position: 'relative',
  },
  topSectionContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  // ── Header ──────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    borderColor: 'rgba(193, 160, 172, 0.22)',
  },
  avatarInitial: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  headerMeta: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  userName: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  headerIconBtnPressed: {
    opacity: 0.65,
  },
  // ── Lower Region: Deep Back in Black ─────────
  lowerRegion: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    backgroundColor: Palette.bg, // Back in Black #16131F
  },
  // ── Section Headers ──────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionSectionHeader: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  sectionAction: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  // ── Transaction List ─────────────────────────
  txList: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.07)',
    marginBottom: Spacing.xl,
    backgroundColor: Palette.surfaceL2,
  },
});
