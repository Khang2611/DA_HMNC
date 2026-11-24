/**
 * LegalDocView.tsx — Terms of Service & Privacy Policy Documents
 *
 * Formatted legal disclosures with clear demonstration disclaimers.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileText, Shield, Info } from 'lucide-react-native';

import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

interface LegalDocViewProps {
  docType: 'terms' | 'privacy_policy';
}

export const LegalDocView: React.FC<LegalDocViewProps> = ({ docType }) => {
  const isTerms = docType === 'terms';

  const title = isTerms
    ? 'Điều khoản & Điều kiện sử dụng'
    : 'Chính sách bảo mật quyền riêng tư';

  const subtitle = isTerms
    ? 'Quy định sử dụng dịch vụ ngân hàng điện tử số Mauve Banking'
    : 'Quy chuẩn thu thập, xử lý và bảo vệ dữ liệu người dùng cá nhân';

  const sections = isTerms
    ? [
        {
          heading: '1. Chấp thuận điều khoản dịch vụ',
          content:
            'Khi tải xuống, cài đặt và kích hoạt tài khoản trên ứng dụng Mauve Banking, bạn xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc bởi toàn bộ các điều khoản và điều kiện được nêu tại văn bản này cùng các quy định pháp luật hiện hành của Ngân hàng Nhà nước Việt Nam.',
        },
        {
          heading: '2. Quyền và nghĩa vụ của người sử dụng',
          content:
            'Khách hàng có trách nhiệm bảo mật tuyệt đối thông tin đăng nhập bao gồm Tên người dùng, Mật khẩu, Mã PIN Smart OTP và các yếu tố xác thực sinh trắc học cá nhân. Mọi giao dịch được xác thực thành công bằng thông tin bảo mật hợp lệ đều được xem là giao dịch do chính khách hàng khởi tạo.',
        },
        {
          heading: '3. Giới hạn hạn mức và giao dịch điện tử',
          content:
            'Các giao dịch chuyển tiền, thanh toán hóa đơn và nạp tiền được điều chỉnh bởi hạn mức giao dịch từng lần và hạn mức tổng trong ngày theo chính sách quản lý rủi ro của Mauve Bank và Thông tư 50/2024/TT-NHNN.',
        },
        {
          heading: '4. Giới hạn trách nhiệm pháp lý',
          content:
            'Mauve Bank không chịu trách nhiệm đối với các thiệt hại phát sinh từ việc thiết bị của khách hàng bị nhiễm mã độc, can thiệp phần mềm hệ thống (Jailbreak/Root), hoặc trường hợp khách hàng tự ý cung cấp mã OTP/thông tin thẻ cho bên thứ ba.',
        },
        {
          heading: '5. Sửa đổi và cập nhật quy định',
          content:
            'Ngân hàng có quyền cập nhật, bổ sung các điều khoản này tại từng thời điểm. Mọi thay đổi sẽ được thông báo chính thức trên ứng dụng trước khi có hiệu lực ít nhất 15 ngày làm việc.',
        },
      ]
    : [
        {
          heading: '1. Dữ liệu cá nhân thu thập',
          content:
            'Chúng tôi chỉ thu thập các dữ liệu cần thiết phục vụ mở tài khoản và xử lý giao dịch tài chính, bao gồm: Họ tên, Ngày sinh, Số CCCD/Hộ chiếu, Số điện thoại, Email, Địa chỉ thường trú và Dữ liệu khuôn mặt phục vụ eKYC.',
        },
        {
          heading: '2. Mục đích xử lý và sử dụng dữ liệu',
          content:
            'Dữ liệu của bạn được sử dụng để: Xác thực danh tính khách hàng, Khởi tạo và ghi nhận giao dịch tài chính, Ngăn ngừa các hành vi gian lận/rửa tiền theo quy định pháp luật và Cá nhân hóa trải nghiệm quản lý tài chính.',
        },
        {
          heading: '3. Tiêu chuẩn bảo mật và mã hóa',
          content:
            'Toàn bộ đường truyền dữ liệu đều được bảo vệ bởi giao thức TLS 1.3 và thuật toán mã hóa AES-256. Mật khẩu và mã PIN Smart OTP được băm một chiều (salted hash) an toàn, không có nhân viên nào có thể truy cập mật mã gốc.',
        },
        {
          heading: '4. Không chia sẻ dữ liệu cho bên thứ ba',
          content:
            'Mauve Bank tuyệt đối không bán, cho thuê hoặc chia sẻ dữ liệu định danh khách hàng cho các đối tác quảng cáo tiếp thị bên ngoài khi chưa có sự chấp thuận rõ ràng của bạn.',
        },
        {
          heading: '5. Quyền của chủ thể dữ liệu',
          content:
            'Bạn có toàn quyền truy cập, yêu cầu chỉnh sửa thông tin liên hệ, yêu cầu trích xuất bản sao dữ liệu hoặc yêu cầu hủy bỏ/đóng tài khoản theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
        },
      ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerIconWrap}>
          {isTerms ? (
            <FileText size={22} color={Palette.light} strokeWidth={1.75} />
          ) : (
            <Shield size={22} color={Palette.incomeGreen} strokeWidth={1.75} />
          )}
        </View>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docSubtitle}>{subtitle}</Text>
        <Text style={styles.effectiveDate}>Phiên bản hiệu lực: 01/2026</Text>
      </View>

      {/* ── Document Sections ── */}
      <View style={styles.sectionsContainer}>
        {sections.map((sec, idx) => (
          <View key={idx} style={styles.sectionItem}>
            <Text style={styles.sectionHeading}>{sec.heading}</Text>
            <Text style={styles.sectionContent}>{sec.content}</Text>
          </View>
        ))}
      </View>

      {/* ── Demo Notice ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Lưu ý: Văn bản này là tài liệu mẫu phục vụ mục đích trình diễn thiết kế và chức năng ứng dụng Mauve Banking, không cấu thành văn kiện pháp lý ràng buộc ngoài đời thực.
          </Text>
        </View>
      </GlassView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  headerCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  docTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  effectiveDate: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  sectionsContainer: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionItem: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  sectionContent: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 20,
  },
  noticeCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    padding: Spacing.md,
  },
  noticeInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    lineHeight: 17,
  },
});
