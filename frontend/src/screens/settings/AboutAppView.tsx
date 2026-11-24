/**
 * AboutAppView.tsx — Application Information & Technical Specification
 *
 * App branding, versioning metadata, technology stack overview, and demo disclaimer.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Info, Code2, Layers, ShieldCheck, Sparkles } from 'lucide-react-native';

import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

export const AboutAppView: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── App Brand Header ── */}
      <View style={styles.brandCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>M</Text>
        </View>

        <Text style={styles.appName}>Mauve Banking</Text>
        <Text style={styles.appTagline}>Trải nghiệm Ngân hàng số Tối giản & Tinh tế</Text>

        <View style={styles.versionBadge}>
          <Text style={styles.versionBadgeText}>Phiên bản 1.0.0 (Build 2026.11-rc4)</Text>
        </View>
      </View>

      {/* ── Architecture & Technology Stack ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>KIẾN TRÚC & CÔNG NGHỆ</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Core Framework */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Code2 size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Nền tảng phát triển</Text>
            <Text style={styles.rowSubtitle}>React Native 0.88 • Expo SDK 58 • TypeScript</Text>
          </View>
        </View>

        {/* Visual System */}
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Sparkles size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Ngôn ngữ thiết kế</Text>
            <Text style={styles.rowSubtitle}>Apple-inspired Liquid Glass & Bảng màu Moonscape</Text>
          </View>
        </View>

        {/* UI Standard */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <Layers size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Quy chuẩn giao diện</Text>
            <Text style={styles.rowSubtitle}>Biểu tượng nét mỏng Lucide • Chuẩn trợ năng WCAG</Text>
          </View>
        </View>
      </View>

      {/* ── Highlights / Capabilities ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CÁC PHÂN HỆ NGÂN HÀNG HOÀN THIỆN</Text>
      </View>

      <View style={styles.featuresCard}>
        <View style={styles.featureItem}>
          <ShieldCheck size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.featureText}>Chuyển tiền nhanh Napas 24/7 & Quét mã VietQR chuẩn</Text>
        </View>

        <View style={styles.featureItem}>
          <ShieldCheck size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.featureText}>Quản lý thẻ phong cách Apple Wallet (Khóa, mở, đổi hạn mức)</Text>
        </View>

        <View style={styles.featureItem}>
          <ShieldCheck size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.featureText}>Quản lý tài chính cá nhân & ngân sách thông minh</Text>
        </View>

        <View style={styles.featureItem}>
          <ShieldCheck size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.featureText}>Thanh toán hóa đơn thiết yếu & Nạp tiền ví điện tử</Text>
        </View>

        <View style={styles.featureItem}>
          <ShieldCheck size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.featureText}>Tiết kiệm tích lũy trực tuyến đa kỳ hạn linh hoạt</Text>
        </View>

        <View style={styles.featureItem}>
          <ShieldCheck size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.featureText}>Lịch sử giao dịch đa chiều với bộ lọc nâng cao</Text>
        </View>
      </View>

      {/* ── Demo Disclaimer Notice ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={17} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Tuyên bố miễn trừ trách nhiệm</Text>
            <Text style={styles.noticeText}>
              Mauve Banking là ứng dụng di động mô phỏng giao dịch ngân hàng cá nhân dành cho mục đích nghiên cứu, phát triển và trình diễn công nghệ. Ứng dụng không kết nối đến hệ thống ngân hàng thực và không xử lý tiền tệ thực tế.
            </Text>
          </View>
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
  brandCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(128, 108, 121, 0.4)',
    borderWidth: 2,
    borderColor: Palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  appName: {
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  versionBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.gray300,
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
  },
  featuresCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
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
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    lineHeight: 17,
  },
});
