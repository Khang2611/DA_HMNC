/**
 * SignInScreen.tsx — Redesigned Sign In Screen with Form Validation for 7Bank
 *
 * Implements Moonscape dark mauve visual identity, exact 7Bank SVG wordmark,
 * comprehensive client-side form validation with onBlur/onSubmit timing,
 * standardized instructional placeholders, field-level error messages,
 * discreet demo quick-fill helper, and smooth keyboard avoidance.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  TextInput,
  TextInputInstance,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react-native';
import { BankWordmark } from '../components/splash/BankLogoSVG';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { loginWithPassword } from '../services/authService';
import { validatePhoneOrEmail } from '../utils/validation';

interface SignInScreenProps {
  visible: boolean;
  onBack: () => void;
  onSuccess: () => void;
  onForgotPassword?: () => void;
  onGoToSignUp?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  visible,
  onBack,
  onSuccess,
  onForgotPassword,
  onGoToSignUp,
}) => {
  const insets = useSafeAreaInsets();

  const phoneOrEmailInputRef = useRef<TextInputInstance | null>(null);
  const passwordInputRef = useRef<TextInputInstance | null>(null);

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Field validation and error states
  const [phoneOrEmailError, setPhoneOrEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serviceError, setServiceError] = useState('');

  // Touched states for blur timing
  const [phoneOrEmailTouched, setPhoneOrEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Field focus tracking
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | null>(null);

  // Entrance animations
  const contentFade = useMemo(() => new Animated.Value(0), []);
  const contentTranslateY = useMemo(() => new Animated.Value(16), []);

  useEffect(() => {
    if (!visible) return;

    const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
    contentFade.setValue(0);
    contentTranslateY.setValue(16);

    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 350,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 400,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, contentFade, contentTranslateY]);

  // ── Validation Handlers ───────────────────────────────────────────────────

  const handlePhoneOrEmailChange = (text: string) => {
    setPhoneOrEmail(text);
    setServiceError('');
    if (phoneOrEmailTouched) {
      const result = validatePhoneOrEmail(text);
      setPhoneOrEmailError(result.isValid ? '' : (result.error || ''));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setServiceError('');
    if (passwordTouched) {
      if (!text) {
        setPasswordError('Vui lòng nhập mật khẩu.');
      } else {
        setPasswordError('');
      }
    }
  };

  const handlePhoneOrEmailBlur = () => {
    setFocusedField(null);
    setPhoneOrEmailTouched(true);
    const result = validatePhoneOrEmail(phoneOrEmail);
    if (!result.isValid) {
      setPhoneOrEmailError(result.error || '');
    } else {
      setPhoneOrEmailError('');
    }
  };

  const handlePasswordBlur = () => {
    setFocusedField(null);
    setPasswordTouched(true);
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
    } else {
      setPasswordError('');
    }
  };

  const handleSignIn = async () => {
    // 1. Validate all fields on submit
    setPhoneOrEmailTouched(true);
    setPasswordTouched(true);
    setServiceError('');

    const phoneOrEmailValidation = validatePhoneOrEmail(phoneOrEmail);
    if (!phoneOrEmailValidation.isValid) {
      setPhoneOrEmailError(phoneOrEmailValidation.error || '');
      phoneOrEmailInputRef.current?.focus();
      return;
    }
    setPhoneOrEmailError('');

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      passwordInputRef.current?.focus();
      return;
    }
    setPasswordError('');

    // 2. Submit credentials to mock auth service
    setIsLoading(true);
    const result = await loginWithPassword(phoneOrEmail.trim(), password);
    setIsLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setServiceError(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleDefaultForgotPassword = useCallback(() => {
    if (onForgotPassword) {
      onForgotPassword();
      return;
    }
    Alert.alert(
      'Khôi phục mật khẩu',
      'Vui lòng liên hệ trung tâm hỗ trợ 7Bank qua tổng đài 1900 7777 hoặc ghé chi nhánh gần nhất để được xác thực và cấp lại mật khẩu an toàn.',
      [{ text: 'Đã hiểu', style: 'default' }]
    );
  }, [onForgotPassword]);

  const handleQuickFillDemo = () => {
    setPhoneOrEmail('0901234567');
    setPassword('Demo1234!');
    setPhoneOrEmailError('');
    setPasswordError('');
    setServiceError('');
    setPhoneOrEmailTouched(true);
    setPasswordTouched(true);
  };

  if (!visible) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Subtle background ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.sm,
              paddingBottom: Math.max(insets.bottom, 16) + Spacing.md,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section: Header & Title */}
          <View style={styles.topSection}>
            <View style={styles.header}>
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
                hitSlop={12}
              >
                <ChevronLeft size={24} color={Palette.light} strokeWidth={2} />
              </Pressable>

              <View style={styles.wordmarkContainer}>
                <BankWordmark variant="splash" width={126} height={36} />
              </View>

              <View style={styles.headerSpacer} />
            </View>

            <Animated.View
              style={[
                styles.titleContainer,
                {
                  opacity: contentFade,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
            >
              <Text style={styles.title}>Chào mừng trở lại</Text>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục trải nghiệm 7Bank</Text>
            </Animated.View>
          </View>

          {/* Center Section: Form Fields */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: contentFade,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* Phone or Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Số điện thoại hoặc email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'phone' && styles.inputWrapperFocused,
                  Boolean(phoneOrEmailError) && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  ref={(el) => {
                    phoneOrEmailInputRef.current = el;
                  }}
                  style={styles.input}
                  value={phoneOrEmail}
                  onChangeText={handlePhoneOrEmailChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={handlePhoneOrEmailBlur}
                  placeholder="Nhập số điện thoại hoặc email"
                  placeholderTextColor={Palette.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  accessibilityLabel="Số điện thoại hoặc email"
                />
              </View>
              {Boolean(phoneOrEmailError) && (
                <View style={styles.fieldErrorRow}>
                  <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                  <Text style={styles.fieldErrorText}>{phoneOrEmailError}</Text>
                </View>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>Mật khẩu</Text>
                <Pressable
                  onPress={handleDefaultForgotPassword}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Quên mật khẩu"
                >
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  styles.passwordWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                  Boolean(passwordError) && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  ref={(el) => {
                    passwordInputRef.current = el;
                  }}
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={handlePasswordBlur}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={Palette.secondary}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  accessibilityLabel="Mật khẩu"
                />

                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={10}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Palette.secondary} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} color={Palette.secondary} strokeWidth={1.8} />
                  )}
                </Pressable>
              </View>
              {Boolean(passwordError) && (
                <View style={styles.fieldErrorRow}>
                  <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            {/* Mock Service Error Banner (Authentication Failure) */}
            {Boolean(serviceError) && (
              <View style={styles.serviceErrorContainer}>
                <AlertCircle size={15} color={Palette.error} strokeWidth={2} />
                <Text style={styles.serviceErrorText}>{serviceError}</Text>
              </View>
            )}

            {/* Primary Submit Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.submitBtn,
                (pressed || isLoading) && styles.submitBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Đăng nhập tài khoản"
            >
              <LinearGradient
                colors={['#A8929F', '#6D5A68']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Palette.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>Đăng nhập</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Bottom Section: Sign Up Switch & Subtle Demo Pill */}
          <View style={styles.bottomSection}>
            {onGoToSignUp && (
              <View style={styles.signUpRow}>
                <Text style={styles.noAccountText}>Chưa có tài khoản?</Text>
                <Pressable
                  onPress={onGoToSignUp}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Đăng ký ngay"
                >
                  <Text style={styles.signUpLinkText}>Đăng ký ngay</Text>
                </Pressable>
              </View>
            )}

            {/* Subtle Demo Quick-Fill Pill */}
            <Pressable
              onPress={handleQuickFillDemo}
              style={({ pressed }) => [
                styles.demoPill,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Điền thông tin tài khoản thử nghiệm"
              hitSlop={6}
            >
              <Sparkles size={12} color={Palette.secondary} strokeWidth={1.8} />
              <Text style={styles.demoPillText}>
                Tài khoản thử nghiệm: <Text style={styles.demoPillBold}>0901234567</Text> • Chạm để điền nhanh
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.bg,
    zIndex: 50,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(128, 108, 121, 0.12)',
  },

  // ── Header & Title ────────────────────────────────────────────────────────
  topSection: {
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  wordmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  titleContainer: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    lineHeight: 22,
  },

  // ── Form Fields ───────────────────────────────────────────────────────────
  formCard: {
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
    opacity: 0.85,
  },
  inputWrapper: {
    minHeight: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.12)',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  inputWrapperFocused: {
    borderColor: 'rgba(240, 217, 228, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  inputWrapperError: {
    borderColor: Palette.error,
  },
  input: {
    fontSize: Typography.fontSize.callout,
    color: Palette.light,
    paddingVertical: Spacing.md,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
    paddingHorizontal: 2,
  },
  fieldErrorText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.error,
    flex: 1,
    lineHeight: 16,
  },

  // ── Service Error Message ─────────────────────────────────────────────────
  serviceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  serviceErrorText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.error,
    flex: 1,
    lineHeight: 18,
  },

  // ── Primary Button ────────────────────────────────────────────────────────
  submitBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  submitBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  submitGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  submitText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.normal,
  },

  // ── Bottom Section ────────────────────────────────────────────────────────
  bottomSection: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  noAccountText: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
  },
  signUpLinkText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    textDecorationLine: 'underline',
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 217, 228, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  demoPillText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.secondary,
  },
  demoPillBold: {
    color: Palette.light,
    fontWeight: Typography.fontWeight.semibold,
  },
});
