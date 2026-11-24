/**
 * NotificationsView.tsx — Notification Preferences
 *
 * Configures transaction alerts, bill payment reminders, security notices,
 * and promotional notifications.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import {
  Bell,
  ArrowUpDown,
  FileText,
  PiggyBank,
  ShieldAlert,
  Sparkles,
  EyeOff,
  Info,
} from 'lucide-react-native';

import { SettingsPreferences, NotificationPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

interface NotificationsViewProps {
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const updateNotifications = (patch: Partial<NotificationPreferences>) => {
    onUpdatePreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        ...patch,
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
          <Bell size={20} color={Palette.light} strokeWidth={2} />
          <Text style={styles.introTitle}>Tùy chỉnh thông báo</Text>
        </View>
        <Text style={styles.introText}>
          Chọn loại thông báo bạn muốn nhận để theo dõi biến động tài chính kịp thời và không bỏ lỡ các ưu đãi đặc quyền.
        </Text>
      </View>

      {/* ── Section: Biến động số dư & Giao dịch ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BIẾN ĐỘNG TÀI CHÍNH</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Transaction Alerts */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <ArrowUpDown size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Giao dịch tài chính tức thời</Text>
            <Text style={styles.rowSubtitle}>
              Thông báo khi có tiền vào hoặc tiền ra khỏi tài khoản thanh toán
            </Text>
          </View>
          <Switch
            value={preferences.notifications.transactions}
            onValueChange={(val) => updateNotifications({ transactions: val })}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.transactions ? Palette.light : Palette.gray400}
            accessibilityLabel="Giao dịch tài chính tức thời"
          />
        </View>

        {/* Balance Changes */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Bell size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Báo cáo số dư định kỳ</Text>
            <Text style={styles.rowSubtitle}>
              Tóm tắt biến động tài chính cuối ngày và sao kê hàng tháng
            </Text>
          </View>
          <Switch
            value={preferences.notifications.balanceChanges}
            onValueChange={(val) => updateNotifications({ balanceChanges: val })}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.balanceChanges ? Palette.light : Palette.gray400}
            accessibilityLabel="Báo cáo số dư định kỳ"
          />
        </View>

        {/* Bill Reminders */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <FileText size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Nhắc nhở hóa đơn sinh hoạt</Text>
            <Text style={styles.rowSubtitle}>
              Báo trước 3 ngày khi có hóa đơn Điện, Nước, Internet đến hạn
            </Text>
          </View>
          <Switch
            value={preferences.notifications.billReminders}
            onValueChange={(val) => updateNotifications({ billReminders: val })}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.billReminders ? Palette.light : Palette.gray400}
            accessibilityLabel="Nhắc nhở hóa đơn sinh hoạt"
          />
        </View>

        {/* Savings Reminders */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <PiggyBank size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Tiết kiệm & Đáo hạn sổ</Text>
            <Text style={styles.rowSubtitle}>
              Nhắc ngày đáo hạn tiền gửi và nhận lãi suất định kỳ
            </Text>
          </View>
          <Switch
            value={preferences.notifications.savingsReminders}
            onValueChange={(val) => updateNotifications({ savingsReminders: val })}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.savingsReminders ? Palette.light : Palette.gray400}
            accessibilityLabel="Tiết kiệm và đáo hạn"
          />
        </View>
      </View>

      {/* ── Section: An ninh & Khuyến mại ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AN NINH & THÔNG TIN ĐẶC QUYỀN</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Security Alerts (Always ON) */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <ShieldAlert size={18} color={Palette.incomeGreen} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <View style={styles.requiredRow}>
              <Text style={styles.rowTitle}>Cảnh báo an ninh & đăng nhập</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>Bắt buộc</Text>
              </View>
            </View>
            <Text style={styles.rowSubtitle}>
              Thông báo khi đăng nhập trên thiết bị mới hoặc phát hiện rủi ro bảo mật
            </Text>
          </View>
          <Switch
            value={true}
            disabled
            trackColor={{ false: Palette.primary, true: Palette.primary }}
            thumbColor={Palette.light}
            accessibilityLabel="Cảnh báo an ninh (Bắt buộc)"
          />
        </View>

        {/* Promotions */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Sparkles size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Tin tức & Ưu đãi thành viên</Text>
            <Text style={styles.rowSubtitle}>
              Cập nhật mã giảm giá, hoàn tiền thẻ và ưu đãi lãi suất
            </Text>
          </View>
          <Switch
            value={preferences.notifications.promotions}
            onValueChange={(val) => updateNotifications({ promotions: val })}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.promotions ? Palette.light : Palette.gray400}
            accessibilityLabel="Tin tức và ưu đãi"
          />
        </View>

        {/* Hide Amount in Previews */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <EyeOff size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Ẩn số tiền trong thông báo</Text>
            <Text style={styles.rowSubtitle}>
              Không hiển thị giá trị tiền mặt trực tiếp trên màn hình khóa
            </Text>
          </View>
          <Switch
            value={preferences.notifications.hideAmountInPreview}
            onValueChange={(val) => updateNotifications({ hideAmountInPreview: val })}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.notifications.hideAmountInPreview ? Palette.light : Palette.gray400}
            accessibilityLabel="Ẩn số tiền trong thông báo"
          />
        </View>
      </View>

      {/* ── Notice: System Push Permission ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Các tùy chọn này áp dụng cho thông báo trong ứng dụng. Để nhận thông báo đẩy tức thời ngay cả khi đã khóa màn hình, vui lòng đảm bảo bạn đã cấp quyền thông báo cho Mauve Banking trong Cài đặt hệ thống của thiết bị.
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
  requiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requiredBadge: {
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  requiredBadgeText: {
    fontSize: 10,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
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
