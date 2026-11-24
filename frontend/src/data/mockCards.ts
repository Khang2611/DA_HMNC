/**
 * Mock Card Data — Mauve Banking
 *
 * Centralized mock card models and initial state.
 * Demo purposes only — entirely fictional card details.
 */

import { BankCard } from '../types/banking';

export const MOCK_CARDS: BankCard[] = [
  {
    id: 'card_debit_01',
    type: 'debit',
    status: 'active',
    network: 'visa',
    cardName: 'Thẻ Ghi nợ Mauve Platinum',
    maskedNumber: '•••• •••• •••• 8829',
    cardholderName: 'QUY NGUYEN',
    expiry: '08/29',
    linkedAccountId: 'acc_primary',
    dailyLimit: 50000000,
    minDailyLimit: 1000000,
    maxDailyLimit: 200000000,
    onlinePaymentsEnabled: true,
    internationalPaymentsEnabled: true,
    contactlessEnabled: true,
    demoDetails: {
      fullCardNumber: '4123 8899 4421 8829',
      cvv: '382',
    },
  },
  {
    id: 'card_credit_01',
    type: 'credit',
    status: 'active',
    network: 'mastercard',
    cardName: 'Thẻ Tín dụng Mauve Infinite',
    maskedNumber: '•••• •••• •••• 6672',
    cardholderName: 'QUY NGUYEN',
    expiry: '11/30',
    linkedAccountId: 'acc_credit',
    creditLimit: 100000000,
    availableLimit: 81550000,
    dailyLimit: 80000000,
    minDailyLimit: 1000000,
    maxDailyLimit: 300000000,
    onlinePaymentsEnabled: true,
    internationalPaymentsEnabled: true,
    contactlessEnabled: true,
    demoDetails: {
      fullCardNumber: '5284 1190 3345 6672',
      cvv: '672',
    },
  },
  {
    id: 'card_napas_01',
    type: 'debit',
    status: 'active',
    network: 'napas',
    cardName: 'Thẻ Nội địa Mauve Smart',
    maskedNumber: '•••• •••• •••• 4120',
    cardholderName: 'QUY NGUYEN',
    expiry: '04/28',
    linkedAccountId: 'acc_primary',
    dailyLimit: 30000000,
    minDailyLimit: 1000000,
    maxDailyLimit: 100000000,
    onlinePaymentsEnabled: true,
    internationalPaymentsEnabled: false,
    contactlessEnabled: true,
    demoDetails: {
      fullCardNumber: '9704 2201 9845 4120',
      cvv: '120',
    },
  },
];

export function getCardNetworkLabel(network: BankCard['network']): string {
  switch (network) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'napas':
      return 'Napas';
    default:
      return '';
  }
}

export function getCardTypeLabel(type: BankCard['type']): string {
  switch (type) {
    case 'debit':
      return 'Thẻ Ghi nợ (Debit)';
    case 'credit':
      return 'Thẻ Tín dụng (Credit)';
    default:
      return 'Thẻ ngân hàng';
  }
}

export function getCardStatusLabel(status: BankCard['status']): string {
  switch (status) {
    case 'active':
      return 'Đang hoạt động';
    case 'locked':
      return 'Đã khóa tạm thời';
    case 'lost':
      return 'Đã báo mất';
    default:
      return '';
  }
}
