/**
 * AppearanceView.tsx — Visual Theme & Display Preferences
 *
 * Moonscape design presentation and reduce-motion accessibility options.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Palette as PaletteIcon, Moon, Zap, Check, Info } from 'lucide-react-native';

import { SettingsPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

interface AppearanceViewProps {
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
}

export const AppearanceView: React.FC<AppearanceViewProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const handleToggleReduceMotion = (val: boolean) => {
    onUpdatePreferences({
      ...preferences,
      reduceMotion: val,
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
          <PaletteIcon size={20} color={Palette.light} strokeWidth={2} />
          <Text style={styles.introTitle}>Giao diện & Trải nghiệm thị giác</Text>
        </View>
        <Text style={styles.introText}>
          Mauve Banking được thiết kế theo phong cách tối giản Apple-inspired Liquid Glass trên nền Back in Black độc quyền.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CHỦ ĐỀ GIAO DIỆN (THEME)</Text>
      </View>

      {/* ── Theme Selection Card (Currently Moonscape Dark is the active identity) ── */}
      <View style={styles.themeCardSelected}>
        <View style={styles.themeHeaderRow}>
          <View style={styles.themeIconWrap}>
            <Moon size={20} color={Palette.light} strokeWidth={2} />
          </View>
          <View style={styles.themeInfo}>
            <View style={styles.themeTitleRow}>
              <Text style={styles.themeTitle}>Moonscape Glass (Tối)</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Đang áp dụng</Text>
              </View>
            </View>
            <Text style={styles.themeSubtitle}>
              Nền Back in Black (#16131F) kết hợp hiệu ứng kính lỏng Liquid Glass
            </Text>
          </View>
          <View style={styles.checkCircle}>
            <Check size={14} color={Palette.white} strokeWidth={2.5} />
          </View>
        </View>

        <View style={styles.palettePreview}>
          <View style={[styles.colorDot, { backgroundColor: '#16131F' }]} />
          <View style={[styles.colorDot, { backgroundColor: '#806C79' }]} />
          <View style={[styles.colorDot, { backgroundColor: '#C1A0AC' }]} />
          <View style={[styles.colorDot, { backgroundColor: '#4A3F4B' }]} />
          <View style={[styles.colorDot, { backgroundColor: '#F0D9E4' }]} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TRỢ NĂNG & HIỆU ỨNG</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Reduce Motion */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <Zap size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Giảm chuyển động (Reduce Motion)</Text>
            <Text style={styles.rowSubtitle}>
              Hạn chế tối đa các hiệu ứng chuyển động và lướt sóng để tăng độ mượt trên thiết bị cấu hình thấp
            </Text>
          </View>
          <Switch
            value={preferences.reduceMotion}
            onValueChange={handleToggleReduceMotion}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.reduceMotion ? Palette.light : Palette.gray400}
            accessibilityLabel="Giảm chuyển động giao diện"
          />
        </View>
      </View>

      {/* ── Guidance Note ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Giao diện Mauve Glass được tối ưu chuẩn xác cho chuẩn hiển thị OLED, giúp tiết kiệm pin tối đa và bảo vệ mắt khi sử dụng trong môi trường thiếu sáng.
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
  themeCardSelected: {
    backgroundColor: 'rgba(30, 24, 38, 0.85)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.secondary,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  themeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  themeTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  activeBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  themeSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  palettePreview: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
