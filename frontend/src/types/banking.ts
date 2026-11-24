export type ThemeMode = 'dark' | 'light';

export type SavingsStatus = 'active' | 'matured' | 'settled';

export type MaturityInstruction = 'transfer_all' | 'renew_principal' | 'renew_all';

export interface SavingsAccount {
  id: string;
  accountNumber: string; // e.g. "STK8829104"
  sourceAccountId: string;
  principal: number;
  termMonths: number;
  annualRate: number; // e.g. 0.050 for 5.0%
  startDate: string; // formatted DD/MM/YYYY
  maturityDate: string; // formatted DD/MM/YYYY
  estimatedInterest: number;
  maturityInstruction: MaturityInstruction;
  status: SavingsStatus;
  settledDate?: string;
  settledAmount?: number;
}

export interface OpenSavingsPayload {
  sourceAccountId: string;
  principal: number;
  termMonths: number;
  annualRate: number;
  maturityInstruction: MaturityInstruction;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'credit';
  cardMask: string;
}

export type TransactionType = 'transfer_out' | 'transfer_in' | 'payment' | 'interest' | 'topup' | 'data_package';

export type TransactionStatus = 'success' | 'pending' | 'failed';

export type MobileServiceTab = 'topup' | 'data';

export type MobileCarrierId = 'viettel' | 'vinaphone' | 'mobifone' | 'vietnamobile';

export interface DataPackage {
  id: string;
  carrier: MobileCarrierId;
  name: string;
  price: number;
  dataAllowance: string;
  validityDays: number;
  description: string;
  is5G: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  timestamp: string;
  type: TransactionType;
  recipientName?: string;
  recipientBank?: string;
  recipientAccountNumber?: string;
  senderName?: string;
  senderBank?: string;
  senderAccountNumber?: string;
  note?: string;
  accountId?: string;
  cardId?: string;
  createdAt?: string; // ISO 8601 string, e.g. "2026-11-22T14:28:00.000Z"
  referenceCode?: string;
  status?: TransactionStatus;
}

// ─────────────────────────────────────────────
// Card Management Types
// ─────────────────────────────────────────────

export type CardType = 'debit' | 'credit';
export type CardStatus = 'active' | 'locked' | 'lost';
export type CardNetwork = 'visa' | 'mastercard' | 'napas';

export interface BankCard {
  id: string;
  type: CardType;
  status: CardStatus;
  network: CardNetwork;
  cardName: string;
  maskedNumber: string;
  cardholderName: string;
  expiry: string;
  linkedAccountId: string;
  dailyLimit: number;
  minDailyLimit: number;
  maxDailyLimit: number;
  onlinePaymentsEnabled: boolean;
  internationalPaymentsEnabled: boolean;
  contactlessEnabled: boolean;
  creditLimit?: number;
  availableLimit?: number;
  demoDetails?: {
    fullCardNumber: string;
    cvv: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  financialCard?: {
    type: 'spending_summary' | 'transfer_preview' | 'balance_alert';
    title: string;
    detail: string;
    amount?: number;
  };
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  route: string;
}

export interface Bank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  bin: string;
}

export interface SavedRecipient {
  id: string;
  name: string;
  accountNumber: string;
  bankId: string;
  bankShortName: string;
  avatarInitial: string;
}

export interface TransferPayload {
  sourceAccountId: string;
  recipientBank: Bank;
  recipientAccountNumber: string;
  recipientName: string;
  amount: number;
  description: string;
  fee: number;
  transactionCode: string;
  timestamp: string;
}
