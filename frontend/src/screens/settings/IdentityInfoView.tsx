/**
 * IdentityInfoView.tsx — Identity & eKYC Information
 *
 * Displays verified identity details (CCCD gắn chip) with privacy masking
 * and a clear demonstration disclosure.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ShieldCheck, CreditCard, User, Calendar, MapPin, Info, CheckCircle2 } from 'lucide-react-native';

import { UserProfile } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { maskIdCard } from '../../data/mockUser';

interface IdentityInfoViewProps {
  userProfile: UserProfile;
}

export const IdentityInfoView: React.FC<IdentityInfoViewProps> = ({ userProfile }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Status Card ── */}
      <GlassView variant="card" borderRadius={Radius.lg} style={styles.statusCard}>
        <View style={styles.statusInner}>
          <View style={styles.statusIconWrap}>
            <ShieldCheck size={28} color={Palette.incomeGreen} strokeWidth={2} />
          </View>
          <View style={styles.statusContent}>
            <View style={styles.statusHeaderRow}>
              <Text style={styles.statusTitle}>Đã hoàn tất định danh eKYC</Text>
              <CheckCircle2 size={16} color={Palette.incomeGreen} strokeWidth={2} />
            </View>
            <Text style={styles.statusSubtitle}>
              Xác thực sinh trắc học khuôn mặt & chip CCCD thành công ngày {userProfile.kycVerifiedAt || '20/01/2025'}
            </Text>
          </View>
        </View>
      </GlassView>

      {/* ── Identity Document Details ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>GIẤY TỜ TÙY THÂN</Text>
      </View>

      <View style={styles.infoGroup}>
        {/* Document Type */}
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <CreditCard size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Loại giấy tờ</Text>
            <Text style={styles.value}>{userProfile.idDocumentType}</Text>
          </View>
        </View>

        {/* Masked ID Number */}
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <ShieldCheck size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Số định danh cá nhân (Số CCCD)</Text>
            <Text style={[styles.value, styles.monoValue]}>
              {maskIdCard(userProfile.idDocumentNumber)}
            </Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>Hiệu lực</Text>
          </View>
        </View>

        {/* Legal Name */}
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <User size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Họ và tên theo CCCD</Text>
            <Text style={styles.value}>{userProfile.fullName.toUpperCase()}</Text>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Calendar size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Ngày sinh</Text>
            <Text style={styles.value}>{userProfile.dateOfBirth}</Text>
          </View>
        </View>

        {/* Issuing Authority */}
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <MapPin size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Nơi cấp</Text>
            <Text style={styles.value}>Cục Cảnh sát QLHC về TTXH</Text>
          </View>
        </View>
      </View>

      {/* ── Demo Disclaimer Notice ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.disclaimerCard}>
        <View style={styles.disclaimerInner}>
          <Info size={17} color={Palette.secondary} strokeWidth={1.75} style={styles.disclaimerIcon} />
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>Thông báo mô phỏng demo</Text>
            <Text style={styles.disclaimerBody}>
              Thông tin định danh đang được mô phỏng cho mục đích trình diễn tính năng Mauve Banking. Dữ liệu này không kết nối đến cơ sở dữ liệu định danh quốc gia thực tế.
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
  statusCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.25)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    lineHeight: 16,
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
  infoGroup: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  infoRow: {
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
  label: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    marginBottom: 2,
  },
  value: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  monoValue: {
    fontFamily: Typography.fontFamily.medium,
    letterSpacing: 1,
  },
  activeTag: {
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  disclaimerCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    padding: Spacing.md,
  },
  disclaimerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    lineHeight: 17,
  },
});
