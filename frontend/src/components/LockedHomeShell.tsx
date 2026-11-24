/**
 * LockedHomeShell.tsx — Safe Protected Shell for Locked Returning Users
 *
 * Rendered beneath QuickAuthOverlay when the app launches in the locked state.
 * Contains ZERO live financial data, NO real account numbers, and NO transactions.
 * Prevents any accidental exposure of confidential banking information while locked.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Lock } from 'lucide-react-native';
import { BankWordmark } from './splash/BankLogoSVG';
import { GlassView } from './GlassView';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';

export const LockedHomeShell: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root} pointerEvents="none">
      {/* ── Upper Region: Moonscape Wavy Gradient ── */}
      <View style={[styles.topSection, { paddingTop: insets.top + Spacing.md }]}>
        <LinearGradient
          colors={[Palette.upperSurface, Palette.bg]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Top Header Placeholder */}
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Lock size={18} color={Palette.secondary} strokeWidth={2} />
          </View>
          <BankWordmark variant="splash" width={110} height={32} />
          <View style={styles.iconPlaceholder}>
            <ShieldCheck size={20} color={Palette.secondary} strokeWidth={1.75} />
          </View>
        </View>

        {/* Masked Card Shell */}
        <GlassView variant="card" borderRadius={Radius.xl} style={styles.cardShell}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.maskBarShort} />
            <View style={styles.lockBadge}>
              <Lock size={12} color={Palette.light} strokeWidth={2} />
              <Text style={styles.lockBadgeText}>Đã khóa</Text>
            </View>
          </View>

          <View style={styles.maskBalanceRow}>
            <Text style={styles.maskBalanceText}>•••••••••••• đ</Text>
          </View>

          <View style={styles.cardFooterRow}>
            <View style={styles.maskBarMedium} />
            <Text style={styles.maskAccountText}>•••• 8888</Text>
          </View>
        </GlassView>
      </View>

      {/* ── Lower Region: Masked Quick Actions & Transactions ── */}
      <View style={styles.lowerRegion}>
        <View style={styles.sectionHeader}>
          <View style={styles.maskBarShort} />
        </View>

        {/* Masked Quick Action Pills */}
        <View style={styles.quickActionsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.quickActionItem}>
              <View style={styles.quickActionCircle} />
              <View style={styles.maskBarVeryShort} />
            </View>
          ))}
        </View>

        {/* Masked Transactions Section */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={styles.maskBarShort} />
        </View>

        <View style={styles.txListShell}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.txRow}>
              <View style={styles.txCircle} />
              <View style={styles.txMeta}>
                <View style={styles.maskBarMedium} />
                <View style={styles.maskBarVeryShort} />
              </View>
              <View style={styles.maskBarShort} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.bg,
    zIndex: 1,
  },
  topSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 108, 121, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShell: {
    padding: Spacing.xl,
    minHeight: 160,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(40, 31, 48, 0.45)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(193, 160, 172, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  lockBadgeText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.light,
    fontWeight: Typography.fontWeight.medium,
  },
  maskBalanceRow: {
    paddingVertical: Spacing.sm,
  },
  maskBalanceText: {
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: 'rgba(240, 217, 228, 0.35)',
    letterSpacing: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maskAccountText: {
    fontSize: Typography.fontSize.footnote,
    color: 'rgba(193, 160, 172, 0.4)',
    fontWeight: Typography.fontWeight.medium,
  },
  lowerRegion: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    flex: 1,
    backgroundColor: Palette.bg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: 68,
  },
  quickActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.12)',
  },
  txListShell: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.07)',
    backgroundColor: Palette.surfaceL2,
    padding: Spacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 217, 228, 0.05)',
  },
  txCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
  },
  txMeta: {
    flex: 1,
    gap: 6,
  },
  maskBarShort: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(193, 160, 172, 0.2)',
  },
  maskBarMedium: {
    width: 120,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(193, 160, 172, 0.2)',
  },
  maskBarVeryShort: {
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(193, 160, 172, 0.12)',
  },
});
