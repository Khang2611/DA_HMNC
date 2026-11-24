// ─────────────────────────────────────────────────────────────────────────────
// Finance categories — definitions + auto-classification
// ─────────────────────────────────────────────────────────────────────────────
import {
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  CreditCard,
  Briefcase,
  Gift,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react-native';
import { FinanceCategory, FinanceCategoryId } from '../types/finance';
import { Transaction } from '../types/banking';

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  // ── Expense ──────────────────────────────────────────────────────────────
  { id: 'food',          label: 'Ăn uống',        type: 'expense',  color: '#FF9F0A', Icon: Utensils },
  { id: 'shopping',      label: 'Mua sắm',         type: 'expense',  color: '#BF5AF2', Icon: ShoppingBag },
  { id: 'transport',     label: 'Di chuyển',       type: 'expense',  color: '#30D158', Icon: Car },
  { id: 'bills',         label: 'Hóa đơn & DV',   type: 'expense',  color: '#64D2FF', Icon: Receipt },
  { id: 'entertainment', label: 'Giải trí',        type: 'expense',  color: '#FF375F', Icon: Gamepad2 },
  { id: 'health',        label: 'Sức khỏe',        type: 'expense',  color: '#32D74B', Icon: HeartPulse },
  { id: 'education',     label: 'Giáo dục',        type: 'expense',  color: '#FFD60A', Icon: GraduationCap },
  { id: 'other_expense', label: 'Chi khác',        type: 'expense',  color: '#FF6B6B', Icon: CreditCard },
  // ── Income ───────────────────────────────────────────────────────────────
  { id: 'salary',        label: 'Lương',           type: 'income',   color: '#32D74B', Icon: Briefcase },
  { id: 'bonus',         label: 'Thưởng',          type: 'income',   color: '#30D158', Icon: Gift },
  { id: 'interest_income', label: 'Lãi tiết kiệm', type: 'income', color: '#FFD60A', Icon: PiggyBank },
  { id: 'other_income',  label: 'Thu nhập khác',   type: 'income',   color: '#64D2FF', Icon: ArrowDownLeft },
  // ── Neutral ──────────────────────────────────────────────────────────────
  { id: 'transfer_out',  label: 'Chuyển tiền',     type: 'neutral',  color: '#8E8E93', Icon: ArrowUpRight },
  { id: 'uncategorized', label: 'Chưa phân loại',  type: 'neutral',  color: '#636366', Icon: HelpCircle },
];

const CATEGORY_MAP = new Map<FinanceCategoryId, FinanceCategory>(
  FINANCE_CATEGORIES.map((c) => [c.id, c])
);

export function getCategoryById(id: FinanceCategoryId): FinanceCategory {
  return CATEGORY_MAP.get(id) ?? FINANCE_CATEGORIES[FINANCE_CATEGORIES.length - 1];
}

/** Auto-classify a transaction based on its type, category, and metadata. */
export function autoClassify(tx: Transaction): FinanceCategoryId {
  const type = tx.type;
  const cat = (tx.category ?? '').toLowerCase();
  const title = (tx.title ?? '').toLowerCase();
  const note = (tx.note ?? '').toLowerCase();
  const recipient = (tx.recipientName ?? '').toLowerCase();
  const fullText = `${title} ${cat} ${note} ${recipient}`;

  switch (type) {
    case 'interest':
      return 'interest_income';

    case 'transfer_in': {
      if (fullText.includes('lương') || fullText.includes('luong') || fullText.includes('salary')) {
        return 'salary';
      }
      if (fullText.includes('thưởng') || fullText.includes('thuong') || fullText.includes('bonus')) {
        return 'bonus';
      }
      return 'other_income';
    }

    case 'transfer_out':
      return 'transfer_out';

    case 'topup':
    case 'data_package':
      return 'bills';

    case 'payment': {
      // 1. Food & Drinks: match specific phrases, never isolated 'ăn' (to avoid 'đăng')
      const foodPhrases = [
        'ăn uống',
        'ẩm thực',
        'thức uống',
        'đồ ăn',
        'nhà hàng',
        'quán ăn',
        'cafe',
        'cà phê',
        'coffee',
        'starbucks',
        'highlands',
        'phở',
        'bún',
        'bánh',
        'trà sữa',
      ];
      if (foodPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase))) {
        return 'food';
      }

      // 2. Shopping / Fashion
      const shoppingPhrases = [
        'mua sắm',
        'thời trang',
        'quần áo',
        'siêu thị',
        'zara',
        'uniqlo',
        'h&m',
        'tiki',
        'shopee',
        'lazada',
      ];
      if (shoppingPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase))) {
        return 'shopping';
      }

      // 3. Transport / Travel
      const transportPhrases = [
        'di chuyển',
        'vận tải',
        'xăng xe',
        'grab',
        'be group',
        'gojek',
        'taxi',
        'vé xe',
        'vé máy bay',
        'hàng không',
      ];
      if (transportPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase))) {
        return 'transport';
      }

      // 4. Bills / Utilities / Subscriptions / Tech / E-Wallet
      const billPhrases = [
        'hóa đơn',
        'tiền điện',
        'tiền nước',
        'internet',
        'truyền hình',
        'viễn thông',
        'công nghệ',
        'đăng ký',
        'dịch vụ',
        'ví điện tử',
        'momo',
        'zalopay',
        'shopeepay',
        'apple',
        'icloud',
        'google',
        'microsoft',
        'adobe',
      ];
      if (billPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase) || note.includes(phrase))) {
        return 'bills';
      }

      // 5. Entertainment
      const entertainmentPhrases = [
        'giải trí',
        'xem phim',
        'cinema',
        'cgv',
        'lotte cinema',
        'netflix',
        'spotify',
        'youtube',
        'game',
      ];
      if (entertainmentPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase))) {
        return 'entertainment';
      }

      // 6. Health & Medical
      const healthPhrases = [
        'sức khỏe',
        'y tế',
        'bệnh viện',
        'phòng khám',
        'nhà thuốc',
        'thuốc',
        'pharmacity',
        'long châu',
      ];
      if (healthPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase))) {
        return 'health';
      }

      // 7. Education
      const educationPhrases = [
        'giáo dục',
        'học phí',
        'khóa học',
        'trường học',
        'sách',
      ];
      if (educationPhrases.some((phrase) => cat.includes(phrase) || title.includes(phrase))) {
        return 'education';
      }

      // Other expenses explicitly marked
      if (cat.includes('chi khác') || cat.includes('chi tiêu khác')) {
        return 'other_expense';
      }

      // Default to uncategorized if uncertain
      return 'uncategorized';
    }

    default:
      return 'uncategorized';
  }
}
