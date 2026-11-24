/**
 * BalanceVisibilityView.tsx — Default Balance Visibility Preference
 *
 * Controls whether financial amounts and account balances are masked by default
 * on the Home screen and banking modules.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Eye, EyeOff, Shield, Info } from 'lucide-react-native';

import { SettingsPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

interface BalanceVisibilityViewProps {
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
}

export const BalanceVisibilityView: React.FC<BalanceVisibilityViewProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [previewHidden, setPreviewHidden] = useState(preferences.hideBalanceByDefault);

  const handleToggleHideBalance = (val: boolean) => {
    setPreviewHidden(val);
    onUpdatePreferences({
      ...preferences,
      hideBalanceByDefault: val,
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
          <Shield size={20} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.introTitle}>Bảo mật hiển thị số dư</Text>
        </View>
        <Text style={styles.introText}>
          Tùy chọn này giúp bảo vệ thông tin tài chính cá nhân bằng cách tự động ẩn số tiền khi bạn mở ứng dụng ở nơi đông người hoặc không gian công cộng.
        </Text>
      </View>

      {/* ── Live Visual Preview Card ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>MÔ PHỎNG TRỰC QUAN TRÊN TRANG CHỦ</Text>
      </View>

      <GlassView variant="card" borderRadius={Radius.lg} style={styles.previewCard}>
        <View style={styles.previewTopRow}>
          <Text style={styles.previewCardLabel}>TÀI KHOẢN THANH TOÁN SAPPHIRE</Text>
          <View style={styles.previewStatusBadge}>
            <Text style={styles.previewStatusText}>
              {previewHidden ? 'Đang che số dư' : 'Đang hiện số dư'}
            </Text>
          </View>
        </View>

        <View style={styles.balanceDisplayRow}>
          <Text style={styles.balanceAmountText}>
            {previewHidden ? '•••••••• ₫' : '148.520.000 ₫'}
          </Text>
          <View style={styles.eyeIconWrap}>
            {previewHidden ? (
              <EyeOff size={22} color={Palette.secondary} strokeWidth={1.75} />
            ) : (
              <Eye size={22} color={Palette.secondary} strokeWidth={1.75} />
            )}
          </View>
        </View>

        <Text style={styles.previewSubtext}>
          Số tài khoản: 9988 •••• 5544 • VND
        </Text>
      </GlassView>

      {/* ── Preference Switch Control ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CÀI ĐẶT MẶC ĐỊNH</Text>
      </View>

      <View style={styles.controlCard}>
        <View style={styles.controlRow}>
          <View style={styles.iconWrap}>
            {preferences.hideBalanceByDefault ? (
              <EyeOff size={20} color={Palette.light} strokeWidth={1.75} />
            ) : (
              <Eye size={20} color={Palette.light} strokeWidth={1.75} />
            )}
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.controlTitle}>Mặc định ẩn số dư khi mở app</Text>
            <Text style={styles.controlSubtitle}>
              Số dư tài khoản sẽ bị che dưới dạng ký tự chấm tròn ngay khi mở ứng dụng
            </Text>
          </View>
          <Switch
            value={preferences.hideBalanceByDefault}
            onValueChange={handleToggleHideBalance}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.hideBalanceByDefault ? Palette.light : Palette.gray400}
            accessibilityLabel="Mặc định ẩn số dư khi mở app"
          />
        </View>
      </View>

      {/* ── Explanation Notice ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Ngay cả khi bật tính năng này, bạn vẫn có thể dễ dàng nhấn trực tiếp vào biểu tượng con mắt trên thẻ tài khoản tại Trang chủ để mở/khóa hiển thị số dư bất cứ lúc nào trong phiên làm việc.
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
  previewCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.85)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.25)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewCardLabel: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: 0.5,
  },
  previewStatusBadge: {
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  previewStatusText: {
    fontSize: 10,
    color: Palette.gray300,
  },
  balanceDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  balanceAmountText: {
    fontSize: 26,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  eyeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSubtext: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
  },
  controlCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 34,
    height: 34,
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
  controlTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  controlSubtitle: {
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
