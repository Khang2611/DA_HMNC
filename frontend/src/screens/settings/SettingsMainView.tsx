/**
 * SettingsMainView.tsx — Main Settings Menu
 *
 * Polished, Apple-inspired grouped settings list with Moonscape palette.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  ShieldCheck,
  CreditCard,
  Lock,
  Fingerprint,
  Smartphone,
  EyeOff,
  Bell,
  Palette as PaletteIcon,
  Globe,
  Eye,
  HelpCircle,
  PhoneCall,
  FileText,
  Shield,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

import { UserProfile, SettingsPreferences, SettingsSubpageKey } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ConfirmationBottomSheet } from '../../components/ConfirmationBottomSheet';

interface SettingsMainViewProps {
  userProfile: UserProfile;
  preferences: SettingsPreferences;
  onNavigateSubpage: (key: SettingsSubpageKey) => void;
  onClose: () => void;
  onSignOut: () => void;
}

interface MenuRowProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  badge?: string;
  isDestructive?: boolean;
  onPress: () => void;
  isLast?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({
  icon: IconComponent,
  title,
  subtitle,
  badge,
  isDestructive,
  onPress,
  isLast,
}) => {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
        !isLast && styles.menuRowBorder,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        style={[
          styles.iconContainer,
          isDestructive && styles.destructiveIconContainer,
        ]}
      >
        <IconComponent
          size={19}
          color={isDestructive ? Palette.expenseRed : Palette.light}
          strokeWidth={1.75}
        />
      </View>

      <View style={styles.menuRowText}>
        <Text
          style={[
            styles.menuRowTitle,
            isDestructive && styles.destructiveTitle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.menuRowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {badge ? (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <ChevronRight size={17} color={Palette.gray500} strokeWidth={1.75} />
    </Pressable>
  );
};

export const SettingsMainView: React.FC<SettingsMainViewProps> = ({
  userProfile,
  preferences,
  onNavigateSubpage,
  onClose,
  onSignOut,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.xl;
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* ── Top Header Bar ── */}
      <ScreenHeader
        title="Cài đặt"
        onBack={onClose}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── A. Profile Header Card ── */}
        <Pressable
          onPress={() => onNavigateSubpage('profile')}
          style={({ pressed }) => [
            styles.profileCard,
            pressed && styles.profileCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Xem hồ sơ của ${userProfile.fullName}`}
        >
          <GlassView variant="card" borderRadius={Radius.lg} style={styles.profileCardInner}>
            <View style={styles.profileRow}>
              {userProfile.avatarUrl ? (
                <Image source={{ uri: userProfile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitialText}>{userProfile.avatarInitial}</Text>
                </View>
              )}

              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {userProfile.fullName}
                  </Text>
                </View>
                <Text style={styles.profileTier} numberOfLines={1}>
                  {userProfile.customerTier}
                </Text>

                <View style={styles.kycBadge}>
                  <ShieldCheck size={12} color={Palette.incomeGreen} strokeWidth={2} />
                  <Text style={styles.kycBadgeText}>Đã xác thực eKYC</Text>
                </View>
              </View>

              <ChevronRight size={20} color={Palette.secondary} strokeWidth={1.75} />
            </View>
          </GlassView>
        </Pressable>

        {/* ── B. My Account (Tài khoản của tôi) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TÀI KHOẢN CỦA TÔI</Text>
        </View>
        <View style={styles.menuGroup}>
          <MenuRow
            icon={User}
            title="Thông tin cá nhân"
            subtitle="Email, số điện thoại & địa chỉ liên hệ"
            onPress={() => onNavigateSubpage('profile')}
          />
          <MenuRow
            icon={ShieldCheck}
            title="Thông tin định danh"
            subtitle="CCCD gắn chip & trạng thái eKYC"
            badge="Đã định danh"
            onPress={() => onNavigateSubpage('identity')}
          />
          <MenuRow
            icon={CreditCard}
            title="Tài khoản mặc định"
            subtitle="Tài khoản thanh toán ưu tiên"
            isLast
            onPress={() => onNavigateSubpage('default_account')}
          />
        </View>

        {/* ── C. Security & Privacy (Bảo mật & Quyền riêng tư) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BẢO MẬT & QUYỀN RIÊNG TƯ</Text>
        </View>
        <View style={styles.menuGroup}>
          <MenuRow
            icon={Lock}
            title="Bảo mật tài khoản"
            subtitle="Đổi mật khẩu & mã PIN giao dịch"
            onPress={() => onNavigateSubpage('security')}
          />
          <MenuRow
            icon={Fingerprint}
            title="Đăng nhập sinh trắc học"
            subtitle={preferences.biometricsEnabled ? 'Đang bật (Face ID / Vân tay)' : 'Đang tắt'}
            badge={preferences.biometricsEnabled ? 'Đang bật' : 'Tắt'}
            onPress={() => onNavigateSubpage('security')}
          />
          <MenuRow
            icon={Smartphone}
            title="Thiết bị đăng nhập"
            subtitle="Quản lý phiên hoạt động & thiết bị tin cậy"
            onPress={() => onNavigateSubpage('devices')}
          />
          <MenuRow
            icon={EyeOff}
            title="Quyền riêng tư"
            subtitle="Ẩn thông tin nhạy cảm & bảo vệ dữ liệu"
            isLast
            onPress={() => onNavigateSubpage('privacy')}
          />
        </View>

        {/* ── D. Application Preferences (Tùy chọn ứng dụng) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TÙY CHỌN ỨNG DỤNG</Text>
        </View>
        <View style={styles.menuGroup}>
          <MenuRow
            icon={Bell}
            title="Thông báo"
            subtitle="Biến động số dư, hóa đơn & bảo mật"
            onPress={() => onNavigateSubpage('notifications')}
          />
          <MenuRow
            icon={PaletteIcon}
            title="Giao diện"
            subtitle="Moonscape Dark (Back in Black)"
            badge="Tối ưu"
            onPress={() => onNavigateSubpage('appearance')}
          />
          <MenuRow
            icon={Globe}
            title="Ngôn ngữ"
            subtitle="Tiếng Việt (Mặc định)"
            badge="VI"
            onPress={() => onNavigateSubpage('language')}
          />
          <MenuRow
            icon={Eye}
            title="Hiển thị số dư"
            subtitle={preferences.hideBalanceByDefault ? 'Mặc định ẩn số dư' : 'Mặc định hiện số dư'}
            isLast
            onPress={() => onNavigateSubpage('balance_visibility')}
          />
        </View>

        {/* ── E. Help & Information (Trợ giúp & Thông tin) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRỢ GIÚP & THÔNG TIN</Text>
        </View>
        <View style={styles.menuGroup}>
          <MenuRow
            icon={HelpCircle}
            title="Trung tâm trợ giúp"
            subtitle="Câu hỏi thường gặp & hướng dẫn"
            onPress={() => onNavigateSubpage('help')}
          />
          <MenuRow
            icon={PhoneCall}
            title="Liên hệ hỗ trợ"
            subtitle="Hotline 24/7, email & chat trợ lý AI"
            onPress={() => onNavigateSubpage('contact')}
          />
          <MenuRow
            icon={FileText}
            title="Điều khoản sử dụng"
            onPress={() => onNavigateSubpage('terms')}
          />
          <MenuRow
            icon={Shield}
            title="Chính sách quyền riêng tư"
            onPress={() => onNavigateSubpage('privacy_policy')}
          />
          <MenuRow
            icon={Info}
            title="Thông tin ứng dụng"
            subtitle="Phiên bản 1.0.0 (Demo)"
            isLast
            onPress={() => onNavigateSubpage('about')}
          />
        </View>

        {/* ── F. Sign Out Action ── */}
        <View style={styles.signOutContainer}>
          <Pressable
            onPress={() => setShowSignOutModal(true)}
            android_ripple={{ color: 'rgba(255, 69, 58, 0.15)' }}
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && styles.signOutBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất tài khoản"
          >
            <LogOut size={18} color={Palette.expenseRed} strokeWidth={1.75} />
            <Text style={styles.signOutBtnText}>Đăng xuất</Text>
          </Pressable>

          <Text style={styles.appVersionFooter}>
            Mauve Banking • v1.0.0 (Bản thử nghiệm)
          </Text>
          <Text style={styles.appDisclaimerFooter}>
            Nền tảng ngân hàng số mô phỏng giao dịch cá nhân
          </Text>
        </View>
      </ScrollView>

      {/* ── Sign Out Confirmation Bottom Sheet ── */}
      <ConfirmationBottomSheet
        visible={showSignOutModal}
        title="Xác nhận đăng xuất"
        message={`Bạn có chắc chắn muốn đăng xuất tài khoản ${userProfile.fullName} khỏi thiết bị này? Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng các dịch vụ ngân hàng.`}
        confirmLabel="Đăng xuất"
        cancelLabel="Huỷ bỏ"
        variant="danger"
        onConfirm={() => {
          setShowSignOutModal(false);
          onSignOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  // Profile Header Card
  profileCard: {
    marginBottom: Spacing.xl,
    borderRadius: Radius.lg,
  },
  profileCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  profileCardInner: {
    padding: Spacing.lg,
    backgroundColor: Palette.surfaceL1,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(128, 108, 121, 0.4)',
    borderWidth: 1.5,
    borderColor: Palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: Spacing.md,
    borderWidth: 1.5,
    borderColor: Palette.secondary,
  },
  avatarInitialText: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 2,
  },
  profileTier: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: 5,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  kycBadgeText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  // Section Headers
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: 0.8,
  },
  // Menu Groups
  menuGroup: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  menuRowPressed: {
    backgroundColor: 'rgba(240, 217, 228, 0.05)',
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(240, 217, 228, 0.08)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  destructiveIconContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
  },
  menuRowText: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  destructiveTitle: {
    color: Palette.expenseRed,
  },
  menuRowSubtitle: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: 'rgba(193, 160, 172, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
  // Sign Out
  signOutContainer: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  signOutBtnPressed: {
    opacity: 0.7,
  },
  signOutBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.expenseRed,
  },
  appVersionFooter: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    marginBottom: 4,
  },
  appDisclaimerFooter: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.gray500,
    textAlign: 'center',
    maxWidth: 280,
  },
});
