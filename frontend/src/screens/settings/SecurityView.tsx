/**
 * SecurityView.tsx — Account Security & Authentication
 *
 * Polished, keyboard-safe security controls for password, PIN, biometrics,
 * and session management with demo-safe simulation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Lock,
  KeyRound,
  Fingerprint,
  Smartphone,
  ChevronRight,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react-native';

import { SettingsPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import {
  validatePassword,
  validateConfirmPassword,
  validateTransactionPin,
  validateConfirmPin,
  sanitizePin,
} from '../../utils/validation';

interface SecurityViewProps {
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
  onNavigateDevices: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  preferences,
  onUpdatePreferences,
  onNavigateDevices,
}) => {
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // PIN fields
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Success toast
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Biometrics toggle
  const handleToggleBiometrics = (val: boolean) => {
    onUpdatePreferences({
      ...preferences,
      biometricsEnabled: val,
    });
    triggerToast(val ? 'Đã kích hoạt đăng nhập sinh trắc học' : 'Đã tắt sinh trắc học');
  };

  // Auto lock selection
  const handleSelectAutoLock = (mins: number) => {
    onUpdatePreferences({
      ...preferences,
      autoLockMinutes: mins,
    });
    setShowAutoLockModal(false);
  };

  // Password validation & submit
  const handleSubmitPassword = () => {
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    const newPassRes = validatePassword(newPassword);
    if (!newPassRes.isValid) {
      setPasswordError(newPassRes.error || 'Mật khẩu mới không hợp lệ.');
      return;
    }
    const confirmPassRes = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmPassRes.isValid) {
      setPasswordError(confirmPassRes.error || 'Mật khẩu xác nhận không khớp.');
      return;
    }

    // Success (Demo simulation)
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerToast('Đổi mật khẩu đăng nhập thành công (Mô phỏng demo)');
  };

  // PIN validation & submit
  const handleSubmitPin = () => {
    setPinError('');
    if (currentPin.length !== 6 || !/^\d{6}$/.test(currentPin)) {
      setPinError('Mã PIN hiện tại phải gồm đúng 6 chữ số.');
      return;
    }
    const pinRes = validateTransactionPin(newPin);
    if (!pinRes.isValid) {
      setPinError(pinRes.error || 'Mã PIN mới không hợp lệ.');
      return;
    }
    const confirmPinRes = validateConfirmPin(newPin, confirmPin);
    if (!confirmPinRes.isValid) {
      setPinError(confirmPinRes.error || 'Mã PIN xác nhận không khớp.');
      return;
    }

    // Success (Demo simulation)
    setShowPinModal(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    triggerToast('Đổi mã PIN giao dịch thành công (Mô phỏng demo)');
  };

  const getAutoLockLabel = (mins: number) => {
    if (mins === 1) return 'Sau 1 phút';
    if (mins === 5) return 'Sau 5 phút';
    if (mins === 15) return 'Sau 15 phút';
    return 'Không bao giờ';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Toast message banner ── */}
      {actionSuccess ? (
        <View style={styles.toastBanner}>
          <CheckCircle2 size={16} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.toastText}>{actionSuccess}</Text>
        </View>
      ) : null}

      {/* ── Section: Xác thực đăng nhập & giao dịch ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>XÁC THỰC & ĐĂNG NHẬP</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Change Password */}
        <Pressable
          onPress={() => {
            setPasswordError('');
            setShowPasswordModal(true);
          }}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Đổi mật khẩu đăng nhập"
        >
          <View style={styles.iconWrap}>
            <Lock size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Đổi mật khẩu đăng nhập</Text>
            <Text style={styles.rowSubtitle}>Cập nhật lần cuối: 30 ngày trước</Text>
          </View>
          <ChevronRight size={17} color={Palette.gray500} strokeWidth={1.75} />
        </Pressable>

        {/* Change Transaction PIN */}
        <Pressable
          onPress={() => {
            setPinError('');
            setShowPinModal(true);
          }}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Đổi mã PIN giao dịch"
        >
          <View style={styles.iconWrap}>
            <KeyRound size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Đổi mã PIN giao dịch</Text>
            <Text style={styles.rowSubtitle}>Mã bảo mật Smart OTP 6 chữ số</Text>
          </View>
          <ChevronRight size={17} color={Palette.gray500} strokeWidth={1.75} />
        </Pressable>

        {/* Biometrics Toggle */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <Fingerprint size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Đăng nhập sinh trắc học</Text>
            <Text style={styles.rowSubtitle}>Face ID / Cảm biến vân tay</Text>
          </View>
          <Switch
            value={preferences.biometricsEnabled}
            onValueChange={handleToggleBiometrics}
            trackColor={{ false: 'rgba(240, 217, 228, 0.15)', true: Palette.primary }}
            thumbColor={preferences.biometricsEnabled ? Palette.light : Palette.gray400}
            accessibilityLabel="Bật tắt đăng nhập sinh trắc học"
          />
        </View>
      </View>

      {/* ── Section: Khóa ứng dụng & Thiết bị ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QUẢN TRỊ PHIÊN HOẠT ĐỘNG</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Auto-Lock Timer */}
        <Pressable
          onPress={() => setShowAutoLockModal(true)}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Tự động khóa ứng dụng"
        >
          <View style={styles.iconWrap}>
            <ShieldAlert size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Tự động khóa ứng dụng</Text>
            <Text style={styles.rowSubtitle}>
              Khi chuyển sang chế độ nền: {getAutoLockLabel(preferences.autoLockMinutes)}
            </Text>
          </View>
          <Text style={styles.valueBadgeText}>{getAutoLockLabel(preferences.autoLockMinutes)}</Text>
          <ChevronRight size={17} color={Palette.gray500} strokeWidth={1.75} />
        </Pressable>

        {/* Session Devices */}
        <Pressable
          onPress={onNavigateDevices}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed, { borderBottomWidth: 0 }]}
          accessibilityRole="button"
          accessibilityLabel="Quản lý thiết bị đăng nhập"
        >
          <View style={styles.iconWrap}>
            <Smartphone size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>Thiết bị đăng nhập</Text>
            <Text style={styles.rowSubtitle}>3 thiết bị đã ghi nhận phiên kết nối</Text>
          </View>
          <ChevronRight size={17} color={Palette.gray500} strokeWidth={1.75} />
        </Pressable>
      </View>

      {/* ── Notice: Demo simulation ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Lưu ý: Mật khẩu và mã PIN trong bản thử nghiệm này được mô phỏng tại giao diện và không lưu trữ văn bản thô trên thiết bị hay truyền lên máy chủ thực tế.
          </Text>
        </View>
      </GlassView>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu đăng nhập</Text>
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <X size={20} color={Palette.gray400} strokeWidth={1.75} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {passwordError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  secureTextEntry={!showPasswordText}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={Palette.gray500}
                />
                <Pressable
                  onPress={() => setShowPasswordText(!showPasswordText)}
                  style={styles.eyeBtn}
                >
                  {showPasswordText ? (
                    <EyeOff size={18} color={Palette.secondary} strokeWidth={1.75} />
                  ) : (
                    <Eye size={18} color={Palette.secondary} strokeWidth={1.75} />
                  )}
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  secureTextEntry={!showPasswordText}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={Palette.gray500}
                />
              </View>

              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  secureTextEntry={!showPasswordText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={Palette.gray500}
                />
              </View>

              <View style={styles.modalActionButtons}>
                <Pressable
                  onPress={() => setShowPasswordModal(false)}
                  style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                >
                  <Text style={styles.btnSecondaryText}>Hủy</Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmitPassword}
                  style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
                >
                  <Text style={styles.btnPrimaryText}>Cập nhật mật khẩu</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Change Transaction PIN Modal ── */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mã PIN Smart OTP</Text>
              <Pressable
                onPress={() => setShowPinModal(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
              >
                <X size={20} color={Palette.gray400} strokeWidth={1.75} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pinError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{pinError}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Mã PIN 6 số hiện tại</Text>
              <TextInput
                style={styles.pinInput}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                value={currentPin}
                onChangeText={(t) => setCurrentPin(sanitizePin(t))}
                placeholder="Nhập mã PIN gồm 6 số"
                placeholderTextColor={Palette.gray500}
              />

              <Text style={styles.inputLabel}>Mã PIN 6 số mới</Text>
              <TextInput
                style={styles.pinInput}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                value={newPin}
                onChangeText={(t) => setNewPin(sanitizePin(t))}
                placeholder="Nhập mã PIN gồm 6 số"
                placeholderTextColor={Palette.gray500}
              />

              <Text style={styles.inputLabel}>Xác nhận mã PIN mới</Text>
              <TextInput
                style={styles.pinInput}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                value={confirmPin}
                onChangeText={(t) => setConfirmPin(sanitizePin(t))}
                placeholder="Nhập lại mã PIN"
                placeholderTextColor={Palette.gray500}
              />

              <View style={styles.modalActionButtons}>
                <Pressable
                  onPress={() => setShowPinModal(false)}
                  style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                >
                  <Text style={styles.btnSecondaryText}>Hủy</Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmitPin}
                  style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
                >
                  <Text style={styles.btnPrimaryText}>Cập nhật mã PIN</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Auto-Lock Selector Modal ── */}
      <Modal
        visible={showAutoLockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAutoLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thời gian tự động khóa</Text>
              <Pressable
                onPress={() => setShowAutoLockModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Palette.gray400} strokeWidth={1.75} />
              </Pressable>
            </View>

            <View style={styles.optionsList}>
              {[1, 5, 15, 0].map((optionMins) => {
                const isSelected = preferences.autoLockMinutes === optionMins;
                return (
                  <Pressable
                    key={optionMins}
                    onPress={() => handleSelectAutoLock(optionMins)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {getAutoLockLabel(optionMins)}
                    </Text>
                    {isSelected ? (
                      <CheckCircle2 size={18} color={Palette.incomeGreen} strokeWidth={2} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  toastBanner: {
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
  toastText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
    flex: 1,
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
  rowPressed: {
    backgroundColor: 'rgba(240, 217, 228, 0.05)',
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
  valueBadgeText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginRight: Spacing.xs,
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
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 11, 18, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderMauve,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  modalCloseBtn: {
    padding: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.expenseRed,
  },
  inputLabel: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.gray300,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 19, 31, 0.8)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.borderMauve,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  modalInput: {
    flex: 1,
    height: 44,
    color: Palette.white,
    fontSize: Typography.fontSize.subheadline,
  },
  eyeBtn: {
    padding: 6,
  },
  pinInput: {
    height: 46,
    backgroundColor: 'rgba(22, 19, 31, 0.8)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.borderMauve,
    color: Palette.white,
    fontSize: Typography.fontSize.title3,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.white,
  },
  btnPrimary: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  btnPressed: {
    opacity: 0.7,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(240, 217, 228, 0.04)',
  },
  optionRowSelected: {
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    borderWidth: 1,
    borderColor: Palette.secondary,
  },
  optionLabel: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.gray300,
  },
  optionLabelSelected: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
});
