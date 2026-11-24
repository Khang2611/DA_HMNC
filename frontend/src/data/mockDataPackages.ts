import { DataPackage, MobileCarrierId } from '../types/banking';

export const MOCK_DATA_PACKAGES: DataPackage[] = [
  // ── Viettel (Mô phỏng Demo) ────────────────────────────────────────────────
  {
    id: 'vt_st5k',
    carrier: 'viettel',
    name: 'ST5K',
    price: 5000,
    dataAllowance: '500 MB',
    validityDays: 1,
    description: '500 MB tốc độ cao trong 24 giờ. Phù hợp nhu cầu kết nối khẩn cấp.',
    is5G: false,
  },
  {
    id: 'vt_st15k',
    carrier: 'viettel',
    name: 'ST15K',
    price: 15000,
    dataAllowance: '3 GB',
    validityDays: 3,
    description: '3 GB tốc độ cao sử dụng trong 3 ngày. Hết lưu lượng dừng truy cập.',
    is5G: false,
  },
  {
    id: 'vt_st30k',
    carrier: 'viettel',
    name: 'ST30K',
    price: 30000,
    dataAllowance: '7 GB',
    validityDays: 7,
    description: '7 GB tốc độ cao trong 7 ngày. Phù hợp cho tuần làm việc, du lịch ngắn ngày.',
    is5G: false,
  },
  {
    id: 'vt_sd70',
    carrier: 'viettel',
    name: 'SD70',
    price: 70000,
    dataAllowance: '15 GB',
    validityDays: 30,
    description: '500 MB/ngày (15 GB/tháng). Phù hợp lướt mạng, đọc tin tức hằng ngày.',
    is5G: false,
  },
  {
    id: 'vt_sd90',
    carrier: 'viettel',
    name: 'SD90',
    price: 90000,
    dataAllowance: '45 GB',
    validityDays: 30,
    description: '1.5 GB/ngày tốc độ cao (45 GB/tháng). Xem video, mạng xã hội mượt mà.',
    is5G: false,
  },
  {
    id: 'vt_5g135',
    carrier: 'viettel',
    name: '5G 135',
    price: 135000,
    dataAllowance: '120 GB',
    validityDays: 30,
    description: '4 GB/ngày 5G siêu tốc độ (120 GB/tháng) kèm miễn phí xem TV360 4K.',
    is5G: true,
  },
  {
    id: 'vt_5g160',
    carrier: 'viettel',
    name: '5G 160',
    price: 160000,
    dataAllowance: '180 GB',
    validityDays: 30,
    description: '6 GB/ngày 5G cực đại (180 GB/tháng), không giới hạn trải nghiệm data đỉnh cao.',
    is5G: true,
  },

  // ── VinaPhone (Mô phỏng Demo) ──────────────────────────────────────────────
  {
    id: 'vn_d3',
    carrier: 'vinaphone',
    name: 'D3',
    price: 15000,
    dataAllowance: '3 GB',
    validityDays: 3,
    description: '3 GB data tốc độ cao dùng trong 3 ngày trên mạng VinaPhone.',
    is5G: false,
  },
  {
    id: 'vn_dt30',
    carrier: 'vinaphone',
    name: 'DT30',
    price: 30000,
    dataAllowance: '7 GB',
    validityDays: 7,
    description: '7 GB tốc độ cao linh hoạt dùng trong 7 ngày.',
    is5G: false,
  },
  {
    id: 'vn_big70',
    carrier: 'vinaphone',
    name: 'BIG70',
    price: 70000,
    dataAllowance: '15 GB',
    validityDays: 30,
    description: '500 MB/ngày (15 GB/tháng) tốc độ cao, hết dung lượng dừng truy cập.',
    is5G: false,
  },
  {
    id: 'vn_vd90',
    carrier: 'vinaphone',
    name: 'VD90',
    price: 90000,
    dataAllowance: '30 GB',
    validityDays: 30,
    description: '1 GB/ngày tốc độ cao kèm ưu đãi gọi nội mạng VinaPhone.',
    is5G: false,
  },
  {
    id: 'vn_5g120',
    carrier: 'vinaphone',
    name: '5G PRO',
    price: 120000,
    dataAllowance: '60 GB',
    validityDays: 30,
    description: '2 GB/ngày 5G băng thông cực cao (60 GB/tháng), độ trễ siêu thấp.',
    is5G: true,
  },
  {
    id: 'vn_5g160',
    carrier: 'vinaphone',
    name: '5G MAX',
    price: 160000,
    dataAllowance: '150 GB',
    validityDays: 30,
    description: '5 GB/ngày 5G siêu tốc độ (150 GB/tháng) cho game thủ và streaming.',
    is5G: true,
  },

  // ── MobiFone (Mô phỏng Demo) ───────────────────────────────────────────────
  {
    id: 'mb_d15',
    carrier: 'mobifone',
    name: 'D15',
    price: 15000,
    dataAllowance: '3 GB',
    validityDays: 3,
    description: '3 GB data tốc độ cao dùng trong 3 ngày kể từ khi kích hoạt.',
    is5G: false,
  },
  {
    id: 'mb_d30',
    carrier: 'mobifone',
    name: 'D30',
    price: 30000,
    dataAllowance: '7 GB',
    validityDays: 7,
    description: '7 GB tốc độ cao sử dụng trong 7 ngày.',
    is5G: false,
  },
  {
    id: 'mb_pt70',
    carrier: 'mobifone',
    name: 'PT70',
    price: 70000,
    dataAllowance: '30 GB',
    validityDays: 30,
    description: '1 GB/ngày (30 GB/tháng) data 4G/LTE ổn định toàn quốc.',
    is5G: false,
  },
  {
    id: 'mb_pt90',
    carrier: 'mobifone',
    name: 'PT90',
    price: 90000,
    dataAllowance: '45 GB',
    validityDays: 30,
    description: '1.5 GB/ngày (45 GB/tháng) tốc độ cao lướt web, nghe nhạc, giải trí.',
    is5G: false,
  },
  {
    id: 'mb_5g135',
    carrier: 'mobifone',
    name: '5G MOBI',
    price: 135000,
    dataAllowance: '90 GB',
    validityDays: 30,
    description: '3 GB/ngày 5G tốc độ tối đa (90 GB/tháng), trải nghiệm mạng thế hệ mới.',
    is5G: true,
  },
  {
    id: 'mb_5g180',
    carrier: 'mobifone',
    name: '5G VIP',
    price: 180000,
    dataAllowance: '180 GB',
    validityDays: 30,
    description: '6 GB/ngày 5G siêu dung lượng (180 GB/tháng) dành cho game và livestream.',
    is5G: true,
  },

  // ── Vietnamobile (Mô phỏng Demo) ───────────────────────────────────────────
  {
    id: 'vnm_d5',
    carrier: 'vietnamobile',
    name: 'D5',
    price: 5000,
    dataAllowance: '2 GB',
    validityDays: 1,
    description: '2 GB data tốc độ cao dùng trong 24 giờ siêu tiết kiệm.',
    is5G: false,
  },
  {
    id: 'vnm_d30',
    carrier: 'vietnamobile',
    name: 'D30',
    price: 30000,
    dataAllowance: '12 GB',
    validityDays: 7,
    description: '12 GB data trong 7 ngày, thoải mái kết nối giá rẻ.',
    is5G: false,
  },
  {
    id: 'vnm_v70',
    carrier: 'vietnamobile',
    name: 'V70',
    price: 70000,
    dataAllowance: '30 GB',
    validityDays: 30,
    description: '1 GB/ngày (30 GB/tháng) truy cập internet nhanh chóng.',
    is5G: false,
  },
  {
    id: 'vnm_v90',
    carrier: 'vietnamobile',
    name: 'V90',
    price: 90000,
    dataAllowance: '60 GB',
    validityDays: 30,
    description: '2 GB/ngày (60 GB/tháng) lướt mạng thả ga cả tháng.',
    is5G: false,
  },
  {
    id: 'vnm_5g120',
    carrier: 'vietnamobile',
    name: '5G VN',
    price: 120000,
    dataAllowance: '90 GB',
    validityDays: 30,
    description: '3 GB/ngày 5G thử nghiệm (90 GB/tháng) tại các thành phố lớn.',
    is5G: true,
  },
];

/**
 * Lấy danh sách gói cước theo nhà mạng.
 */
export function getDataPackagesByCarrier(carrierId: string): DataPackage[] {
  return MOCK_DATA_PACKAGES.filter((p) => p.carrier === carrierId);
}

/**
 * Gợi ý nhà mạng dựa trên đầu số điện thoại di động Việt Nam.
 * Lưu ý: Chỉ mang tính chất gợi ý (suggestion) vì người dùng có thể chuyển mạng giữ số.
 */
export function detectCarrierByPrefix(phone: string): MobileCarrierId | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 3) return null;
  const prefix3 = digits.slice(0, 3);

  const viettelPrefixes = ['086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];
  const vinaphonePrefixes = ['088', '091', '094', '081', '082', '083', '084', '085'];
  const mobifonePrefixes = ['089', '090', '093', '070', '079', '077', '076', '078'];
  const vietnamobilePrefixes = ['092', '056', '058', '052'];

  if (viettelPrefixes.includes(prefix3)) return 'viettel';
  if (vinaphonePrefixes.includes(prefix3)) return 'vinaphone';
  if (mobifonePrefixes.includes(prefix3)) return 'mobifone';
  if (vietnamobilePrefixes.includes(prefix3)) return 'vietnamobile';

  return null;
}
