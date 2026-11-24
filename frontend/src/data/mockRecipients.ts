import { Bank, SavedRecipient } from '../types/banking';

export const VIETNAMESE_BANKS: Bank[] = [
  { id: 'vcb', code: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank', bin: '970436' },
  { id: 'tcb', code: 'TCB', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank', bin: '970407' },
  { id: 'mb',  code: 'MB',  name: 'Ngân hàng TMCP Quân đội', shortName: 'MBBank', bin: '970422' },
  { id: 'bidv',code: 'BIDV',name: 'Ngân hàng TMCP Đầu tư và Phát triển VN', shortName: 'BIDV', bin: '970418' },
  { id: 'ctg', code: 'CTG', name: 'Ngân hàng TMCP Công thương Việt Nam', shortName: 'VietinBank', bin: '970415' },
  { id: 'acb', code: 'ACB', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB', bin: '970416' },
  { id: 'tpb', code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank', bin: '970423' },
  { id: 'vpb', code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank', bin: '970432' },
  { id: 'stb', code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank', bin: '970403' },
  { id: 'ocb', code: 'OCB', name: 'Ngân hàng TMCP Phương Đông', shortName: 'OCB', bin: '970448' },
  { id: 'hdb', code: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM', shortName: 'HDBank', bin: '970437' },
  { id: 'vib', code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB', bin: '970441' },
];

export const SAVED_RECIPIENTS: SavedRecipient[] = [
  {
    id: 'rec_01',
    name: 'NGUYEN LAN HUONG',
    accountNumber: '190388291102',
    bankId: 'tcb',
    bankShortName: 'Techcombank',
    avatarInitial: 'H',
  },
  {
    id: 'rec_02',
    name: 'TRAN MINH QUAN',
    accountNumber: '007100123456',
    bankId: 'vcb',
    bankShortName: 'Vietcombank',
    avatarInitial: 'Q',
  },
  {
    id: 'rec_03',
    name: 'LE HOANG YEN',
    accountNumber: '088899996688',
    bankId: 'mb',
    bankShortName: 'MBBank',
    avatarInitial: 'Y',
  },
  {
    id: 'rec_04',
    name: 'PHAM QUOC DUNG',
    accountNumber: '246813579024',
    bankId: 'acb',
    bankShortName: 'ACB',
    avatarInitial: 'D',
  },
  {
    id: 'rec_05',
    name: 'VU HAI NAM',
    accountNumber: '012345678901',
    bankId: 'tpb',
    bankShortName: 'TPBank',
    avatarInitial: 'N',
  },
];

/**
 * Mock Napas 247 real-time beneficiary name lookup.
 * Simulates real banking verification by returning matching saved name
 * or generating a deterministic uppercase Vietnamese name.
 */
export function lookupRecipientName(bankId: string, accountNumber: string): string {
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length < 6) return '';

  const matched = SAVED_RECIPIENTS.find(
    (r) => r.accountNumber.replace(/\s+/g, '') === clean && r.bankId === bankId
  );
  if (matched) return matched.name;

  // Mock deterministic names for realistic user experience
  const sampleNames = [
    'HOANG VAN THAI',
    'DANG THI LINH',
    'NGUYEN QUOC BAO',
    'TRAN THAO VY',
    'LE MINH TRIET',
    'VO THI KIM NGAN',
    'BUI DUC THANG',
    'DOAN PHUONG ANH',
  ];

  const lastDigit = parseInt(clean.slice(-1), 10) || 0;
  return sampleNames[lastDigit % sampleNames.length];
}
