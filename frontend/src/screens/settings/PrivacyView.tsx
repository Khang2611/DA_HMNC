/**
 * PrivacyView.tsx — Privacy Settings & Data Protection
 *
 * Controls sensitive data masking, preview visibility, and privacy notices.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { EyeOff, Eye, ShieldCheck, BellOff, Info } from 'lucide-react-native';

import { SettingsPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

interface PrivacyViewProps {
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const handleToggleHideBalance = (val: boolean) => {
    onUpdatePreferences({
      ...preferences,
      hideBalanceByDefault: val,
    });
  };

  const handleToggleHidePreview = (val: boolean) => {
    onUpdatePreferences({
      ...preferences,
      hideSensitiveInfoInPreview: val,
    });
  };

  const handleToggleHideNotificationAmount = (val: boolean) => {
    onUpdatePreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        hideAmountInPreview: val,
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <ShieldCheck size={20} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.introTitle}>Quyền riêng tư & Bảo mật dữ liệu</Text>
        </View>
        <Text style={styles.introText}>
          Tùy chỉnh mức độ hiển thị thông tin tài chính cá nhân ở nơi công cộng và trên màn hình khóa điện thoại của bạn.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>HIỂN THỊ DỮ LIỆU NHẠY CẢM</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Hide Balance by Default */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <EyeOff size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Mặc định ẩn số dư tài khoản</Text>
            <Text style={styles.rowSubtitle}>
              Tự động che số dư khi mở ứng dụng; chỉ hiển thị khi bạn nhấn vào biểu tượng mắt
            </Text>
          </View>
          <Switch
            value={preferences.hideBalanceByDefault}
            onValueChange={handleToggleHideBalance}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.hideBalanceByDefault ? Palette.light : Palette.gray400}
            accessibilityLabel="Mặc định ẩn số dư tài khoản"
          />
        </View>

        {/* Hide Info in App Switcher Preview */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Eye size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Làm mờ khi chuyển đa nhiệm</Text>
            <Text style={styles.rowSubtitle}>
              Tự động làm mờ màn hình ứng dụng trong danh sách đa nhiệm để chống nhìn trộm
            </Text>
          </View>
          <Switch
            value={preferences.hideSensitiveInfoInPreview}
            onValueChange={handleToggleHidePreview}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.hideSensitiveInfoInPreview ? Palette.light : Palette.gray400}
            accessibilityLabel="Làm mờ khi chuyển ứng dụng"
          />
        </View>

        {/* Hide Amount in Push Notifications */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <BellOff size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Ẩn số tiền trong thông báo đẩy</Text>
            <Text style={styles.rowSubtitle}>
              Thông báo trên màn hình khóa chỉ hiển thị &quot;Biến động số dư&quot; thay vì số tiền cụ thể
            </Text>
          </View>
          <Switch
            value={preferences.notifications.hideAmountInPreview}
            onValueChange={handleToggleHideNotificationAmount}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.hideAmountInPreview ? Palette.light : Palette.gray400}
            accessibilityLabel="Ẩn số tiền trong thông báo đẩy"
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CAM KẾT BẢO VỆ DỮ LIỆU</Text>
      </View>

      <GlassView variant="card" borderRadius={Radius.lg} style={styles.policyCard}>
        <View style={styles.policyRow}>
          <Text style={styles.policyBullet}>•</Text>
          <Text style={styles.policyText}>
            Dữ liệu cá nhân và thông tin tài khoản được mã hóa tiêu chuẩn quân sự AES-256 cả khi truyền tải lẫn lưu trữ.
          </Text>
        </View>

        <View style={styles.policyRow}>
          <Text style={styles.policyBullet}>•</Text>
          <Text style={styles.policyText}>
            Mauve Banking cam kết không bán hoặc chia sẻ thông tin hành vi tài chính của bạn cho bất kỳ đơn vị quảng cáo trung gian nào.
          </Text>
        </View>

        <View style={styles.policyRow}>
          <Text style={styles.policyBullet}>•</Text>
          <Text style={styles.policyText}>
            Bạn hoàn toàn có quyền yêu cầu trích xuất bản sao dữ liệu cá nhân hoặc yêu cầu đóng tài khoản bất kỳ lúc nào.
          </Text>
        </View>
      </GlassView>

      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Các tùy chọn bảo mật trên được lưu trữ trực tiếp trên thiết bị của bạn và tự động đồng bộ khi bạn đăng nhập tài khoản.
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
  introCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  introText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: 0.8,
  },
  cardGroup: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(240, 217, 228, 0.08)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rowTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  rowSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    marginTop: 2,
    lineHeight: 16,
  },
  policyCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  policyBullet: {
    fontSize: Typography.fontSize.headline,
    color: Palette.secondary,
    marginRight: Spacing.sm,
    lineHeight: 18,
  },
  policyText: {
    flex: 1,
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 18,
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
