/**
 * ProfileDetailView.tsx — Personal Profile View & Edit
 *
 * View and edit personal contact info (email, address, avatar) with
 * appropriate security restrictions on legal name and identity fields.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Camera,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Calendar,
  Lock,
  Check,
  Edit2,
  Info,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { UserProfile } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { FeedbackDialog, FeedbackVariant } from '../../components/FeedbackDialog';
import { maskPhoneNumber, maskIdCard } from '../../data/mockUser';

interface ProfileDetailViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onNavigateIdentity: () => void;
}

export const ProfileDetailView: React.FC<ProfileDetailViewProps> = ({
  userProfile,
  onUpdateProfile,
  onNavigateIdentity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(userProfile.email);
  const [address, setAddress] = useState(userProfile.address);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(userProfile.avatarUrl);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    variant: FeedbackVariant;
    title: string;
    message?: string;
  }>({
    visible: false,
    variant: 'info',
    title: '',
  });

  // Avatar Picker
  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setFeedback({
          visible: true,
          variant: 'warning',
          title: 'Quyền truy cập ảnh',
          message: 'Vui lòng cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện cá nhân.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setAvatarUri(selectedUri);
        const updatedProfile = { ...userProfile, avatarUrl: selectedUri };
        onUpdateProfile(updatedProfile);
        setFeedback({
          visible: true,
          variant: 'success',
          title: 'Đổi ảnh đại diện',
          message: 'Ảnh đại diện của bạn đã được cập nhật thành công.',
        });
      }
    } catch (err) {
      console.warn('[ProfileDetailView] Error picking image:', err);
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Thông báo',
        message: 'Không thể chọn ảnh lúc này. Vui lòng thử lại sau.',
      });
    }
  };

  const handleSaveContact = () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Email không hợp lệ',
        message: 'Vui lòng nhập định dạng email chính xác.',
      });
      return;
    }

    if (!address.trim()) {
      setFeedback({
        visible: true,
        variant: 'error',
        title: 'Địa chỉ trống',
        message: 'Vui lòng nhập địa chỉ liên hệ của bạn.',
      });
      return;
    }

    const updated: UserProfile = {
      ...userProfile,
      email: email.trim(),
      address: address.trim(),
      avatarUrl: avatarUri,
    };

    onUpdateProfile(updated);
    setIsEditing(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
    setFeedback({
      visible: true,
      variant: 'success',
      title: 'Cập nhật thành công',
      message: 'Thông tin cá nhân của bạn đã được cập nhật.',
    });
  };

  const handleCancelEdit = () => {
    setEmail(userProfile.email);
    setAddress(userProfile.address);
    setIsEditing(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{userProfile.avatarInitial}</Text>
              </View>
            )}

            <Pressable
              onPress={handlePickAvatar}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true, radius: 18 }}
              style={({ pressed }) => [styles.avatarEditBadge, pressed && styles.badgePressed]}
              accessibilityRole="button"
              accessibilityLabel="Thay đổi ảnh đại diện"
            >
              <Camera size={14} color={Palette.white} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.fullNameText}>{userProfile.fullName}</Text>
          <Text style={styles.customerTierText}>{userProfile.customerTier}</Text>
          <Text style={styles.customerIdText}>Mã KH: {userProfile.customerId}</Text>
        </View>

        {/* ── Success Toast Banner ── */}
        {saveSuccessMsg ? (
          <View style={styles.successBanner}>
            <Check size={16} color={Palette.incomeGreen} strokeWidth={2} />
            <Text style={styles.successBannerText}>
              Đã cập nhật thông tin liên hệ thành công!
            </Text>
          </View>
        ) : null}

        {/* ── Verified Identity Information (Read-Only) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>THÔNG TIN ĐÃ ĐỊNH DANH (eKYC)</Text>
          <View style={styles.verifiedTag}>
            <ShieldCheck size={12} color={Palette.incomeGreen} strokeWidth={2} />
            <Text style={styles.verifiedTagText}>Đã đối soát</Text>
          </View>
        </View>

        <View style={styles.cardGroup}>
          {/* Legal Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <User size={18} color={Palette.light} strokeWidth={1.75} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Họ và tên pháp lý</Text>
              <Text style={styles.infoValue}>{userProfile.fullName}</Text>
            </View>
            <Lock size={15} color={Palette.gray500} strokeWidth={1.75} />
          </View>

          {/* Date of Birth */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Calendar size={18} color={Palette.light} strokeWidth={1.75} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày sinh</Text>
              <Text style={styles.infoValue}>{userProfile.dateOfBirth}</Text>
            </View>
            <Lock size={15} color={Palette.gray500} strokeWidth={1.75} />
          </View>

          {/* ID Document Masked */}
          <Pressable
            onPress={onNavigateIdentity}
            style={({ pressed }) => [styles.infoRow, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Xem chi tiết thông tin định danh"
          >
            <View style={styles.infoIconWrap}>
              <ShieldCheck size={18} color={Palette.light} strokeWidth={1.75} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{userProfile.idDocumentType}</Text>
              <Text style={styles.infoValue}>{maskIdCard(userProfile.idDocumentNumber)}</Text>
            </View>
            <Text style={styles.viewDetailsText}>Chi tiết</Text>
          </Pressable>
        </View>

        {/* ── Contact Information (Editable) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>THÔNG TIN LIÊN HỆ</Text>
          {!isEditing ? (
            <Pressable
              onPress={() => setIsEditing(true)}
              style={({ pressed }) => [styles.editActionBtn, pressed && styles.badgePressed]}
              accessibilityRole="button"
              accessibilityLabel="Chỉnh sửa thông tin"
            >
              <Edit2 size={13} color={Palette.secondary} strokeWidth={1.75} />
              <Text style={styles.editActionText}>Chỉnh sửa</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.cardGroup}>
          {/* Phone Number (Masked, requires eKYC flow to update) */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Phone size={18} color={Palette.light} strokeWidth={1.75} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại nhận OTP</Text>
              <Text style={styles.infoValue}>{maskPhoneNumber(userProfile.phoneNumber)}</Text>
            </View>
            <Lock size={15} color={Palette.gray500} strokeWidth={1.75} />
          </View>

          {/* Contact Email */}
          <View style={[styles.infoRow, isEditing && styles.editingRow]}>
            <View style={styles.infoIconWrap}>
              <Mail size={18} color={Palette.light} strokeWidth={1.75} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email nhận thông báo giao dịch</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Nhập địa chỉ email"
                  placeholderTextColor={Palette.gray500}
                  accessibilityLabel="Nhập địa chỉ email mới"
                />
              ) : (
                <Text style={styles.infoValue}>{userProfile.email}</Text>
              )}
            </View>
          </View>

          {/* Contact Address */}
          <View style={[styles.infoRow, isEditing && styles.editingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconWrap}>
              <MapPin size={18} color={Palette.light} strokeWidth={1.75} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ liên hệ</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={2}
                  placeholder="Nhập địa chỉ liên hệ"
                  placeholderTextColor={Palette.gray500}
                  accessibilityLabel="Nhập địa chỉ liên hệ mới"
                />
              ) : (
                <Text style={styles.infoValue}>{userProfile.address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Edit Action Buttons (inside ScrollView, avoiding fixed overlay) ── */}
        {isEditing ? (
          <View style={styles.editButtonsRow}>
            <Pressable
              onPress={handleCancelEdit}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Hủy chỉnh sửa"
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveContact}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Lưu thông tin"
            >
              <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Info Notice ── */}
        <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
          <View style={styles.noticeInner}>
            <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
            <Text style={styles.noticeText}>
              Theo quy định ngân hàng, việc thay đổi Họ tên, Ngày sinh hoặc Số điện thoại đăng ký nhận mã OTP cần được đối soát trực tiếp qua Video Call eKYC hoặc tại quầy giao dịch Mauve Bank.
            </Text>
          </View>
        </GlassView>
      </ScrollView>

      <FeedbackDialog
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(128, 108, 121, 0.45)',
    borderWidth: 2,
    borderColor: Palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: Palette.secondary,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primary,
    borderWidth: 2,
    borderColor: Palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePressed: {
    opacity: 0.7,
  },
  fullNameText: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 4,
  },
  customerTierText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    marginBottom: 2,
  },
  customerIdText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.25)',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  successBannerText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editActionText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  cardGroup: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.lg,
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
  editingRow: {
    backgroundColor: 'rgba(240, 217, 228, 0.03)',
  },
  rowPressed: {
    backgroundColor: 'rgba(240, 217, 228, 0.05)',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  viewDetailsText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  textInput: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.white,
    backgroundColor: 'rgba(22, 19, 31, 0.8)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.borderMauve,
    marginTop: 4,
  },
  multilineInput: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  btnPressed: {
    opacity: 0.7,
  },
  noticeCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
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
