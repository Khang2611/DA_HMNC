/**
 * SignUpScreen.tsx — Redesigned Multi-step Registration Flow with Form Validation for 7Bank
 *
 * 5 Functional Steps + 1 Completion Step:
 *   1. Phone number entry (with validation & "Đã có tài khoản? Đăng nhập" link)
 *   2. OTP verification (with 6-digit validation & discrete demo helper)
 *   3. Personal information (Full name & Date of Birth calendar validation)
 *   4. Password creation (with live password requirement indicators & matching confirmation)
 *   5. Transaction PIN setup & confirmation (6-digit PIN with weak pattern rejection & match check)
 *   6. Completion (Animated success state -> Auto-redirect into app)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Lock,
  Check,
  Circle,
} from 'lucide-react-native';
import { BankWordmark } from '../components/splash/BankLogoSVG';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import {
  requestOTP,
  verifyOTP,
  registerAccount,
} from '../services/authService';
import {
  validatePhone,
  validateOTP,
  validateFullName,
  validateDateOfBirth,
  validatePassword,
  validateConfirmPassword,
  validateTransactionPin,
  validateConfirmPin,
  checkPasswordCriteria,
  sanitizePhone,
  sanitizeDateOfBirth,
  sanitizeOTP,
  sanitizePin,
} from '../utils/validation';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SignUpScreenProps {
  visible: boolean;
  onBack: () => void;
  onSuccess: () => void;
  onGoToSignIn?: () => void;
}

type Step = 'phone' | 'otp' | 'info' | 'password' | 'pin' | 'done';

const STEP_LABELS: Record<Exclude<Step, 'done'>, { stepNum: number; title: string }> = {
  phone: { stepNum: 1, title: 'Số điện thoại' },
  otp: { stepNum: 2, title: 'Xác thực OTP' },
  info: { stepNum: 3, title: 'Thông tin cá nhân' },
  password: { stepNum: 4, title: 'Mật khẩu' },
  pin: { stepNum: 5, title: 'Mã PIN giao dịch' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  visible,
  onBack,
  onSuccess,
  onGoToSignIn,
}) => {
  const insets = useSafeAreaInsets();

  // Input refs for focus management
  const phoneRef = useRef<TextInputInstance | null>(null);
  const otpRef = useRef<TextInputInstance | null>(null);
  const fullNameRef = useRef<TextInputInstance | null>(null);
  const dobRef = useRef<TextInputInstance | null>(null);
  const passwordRef = useRef<TextInputInstance | null>(null);
  const confirmPasswordRef = useRef<TextInputInstance | null>(null);
  const pinRef = useRef<TextInputInstance | null>(null);
  const confirmPinRef = useRef<TextInputInstance | null>(null);

  // Registration form values
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Field-level error messages
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [serviceError, setServiceError] = useState('');

  // Touched states for blur timing
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [dateOfBirthTouched, setDateOfBirthTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [pinTouched, setPinTouched] = useState(false);
  const [confirmPinTouched, setConfirmPinTouched] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Live password criteria
  const passwordCriteria = useMemo(() => checkPasswordCriteria(password), [password]);

  // Entrance & Step animations
  const stepOpacity = useMemo(() => new Animated.Value(1), []);
  const stepTranslateX = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!visible) return;
    stepOpacity.setValue(1);
    stepTranslateX.setValue(0);
  }, [visible, stepOpacity, stepTranslateX]);

  const transitionTo = (nextStep: Step, direction: 'forward' | 'backward' = 'forward') => {
    setServiceError('');
    const enterOffset = direction === 'forward' ? 30 : -30;

    Animated.timing(stepOpacity, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      stepTranslateX.setValue(enterOffset);
      Animated.parallel([
        Animated.timing(stepOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ── Step Navigation Handlers ───────────────────────────────────────────────

  const handleBackPress = () => {
    setServiceError('');
    switch (step) {
      case 'phone':
        onBack();
        break;
      case 'otp':
        transitionTo('phone', 'backward');
        break;
      case 'info':
        transitionTo('otp', 'backward');
        break;
      case 'password':
        transitionTo('info', 'backward');
        break;
      case 'pin':
        transitionTo('password', 'backward');
        break;
      case 'done':
        break;
    }
  };

  // ── Step 1: Phone Validation & Submit ─────────────────────────────────────

  const handlePhoneChange = (text: string) => {
    const clean = sanitizePhone(text);
    setPhone(clean);
    setServiceError('');
    if (phoneTouched) {
      const res = validatePhone(clean);
      setPhoneError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handlePhoneBlur = () => {
    setFocusedField(null);
    setPhoneTouched(true);
    const res = validatePhone(phone);
    setPhoneError(res.isValid ? '' : (res.error || ''));
  };

  const handlePhoneSubmit = async () => {
    setPhoneTouched(true);
    const validation = validatePhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || '');
      phoneRef.current?.focus();
      return;
    }
    setPhoneError('');
    setServiceError('');

    setIsLoading(true);
    const result = await requestOTP(phone);
    setIsLoading(false);

    if (result.success) {
      transitionTo('otp', 'forward');
    } else {
      setServiceError(result.error || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
    }
  };

  // ── Step 2: OTP Validation & Submit ───────────────────────────────────────

  const handleOtpChange = (text: string) => {
    const clean = sanitizeOTP(text);
    setOtp(clean);
    setOtpError('');
    setServiceError('');
  };

  const handleOtpSubmit = async () => {
    const validation = validateOTP(otp);
    if (!validation.isValid) {
      setOtpError(validation.error || '');
      otpRef.current?.focus();
      return;
    }
    setOtpError('');
    setServiceError('');

    setIsLoading(true);
    const result = await verifyOTP(phone, otp);
    setIsLoading(false);

    if (result.success) {
      transitionTo('info', 'forward');
    } else {
      setServiceError(result.error || 'Mã xác thực không chính xác.');
    }
  };

  // ── Step 3: Info Validation & Submit ──────────────────────────────────────

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (fullNameTouched) {
      const res = validateFullName(text);
      setFullNameError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleFullNameBlur = () => {
    setFocusedField(null);
    setFullNameTouched(true);
    const res = validateFullName(fullName);
    setFullNameError(res.isValid ? '' : (res.error || ''));
  };

  const handleDobChange = (text: string) => {
    const clean = sanitizeDateOfBirth(text);
    setDateOfBirth(clean);
    if (dateOfBirthTouched) {
      const res = validateDateOfBirth(clean);
      setDateOfBirthError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleDobBlur = () => {
    setFocusedField(null);
    setDateOfBirthTouched(true);
    const res = validateDateOfBirth(dateOfBirth);
    setDateOfBirthError(res.isValid ? '' : (res.error || ''));
  };

  const handleInfoSubmit = () => {
    setFullNameTouched(true);
    setDateOfBirthTouched(true);

    const nameValidation = validateFullName(fullName);
    if (!nameValidation.isValid) {
      setFullNameError(nameValidation.error || '');
      fullNameRef.current?.focus();
      return;
    }
    setFullNameError('');

    const dobValidation = validateDateOfBirth(dateOfBirth);
    if (!dobValidation.isValid) {
      setDateOfBirthError(dobValidation.error || '');
      dobRef.current?.focus();
      return;
    }
    setDateOfBirthError('');

    transitionTo('password', 'forward');
  };

  // ── Step 4: Password Validation & Submit ──────────────────────────────────

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordTouched) {
      const res = validatePassword(text);
      setPasswordError(res.isValid ? '' : (res.error || ''));
    }
    if (confirmPasswordTouched && confirmPassword) {
      const matchRes = validateConfirmPassword(text, confirmPassword);
      setConfirmPasswordError(matchRes.isValid ? '' : (matchRes.error || ''));
    }
  };

  const handlePasswordBlur = () => {
    setFocusedField(null);
    setPasswordTouched(true);
    const res = validatePassword(password);
    setPasswordError(res.isValid ? '' : (res.error || ''));
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordTouched) {
      const res = validateConfirmPassword(password, text);
      setConfirmPasswordError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleConfirmPasswordBlur = () => {
    setFocusedField(null);
    setConfirmPasswordTouched(true);
    const res = validateConfirmPassword(password, confirmPassword);
    setConfirmPasswordError(res.isValid ? '' : (res.error || ''));
  };

  const handlePasswordSubmit = () => {
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      setPasswordError(passValidation.error || '');
      passwordRef.current?.focus();
      return;
    }
    setPasswordError('');

    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmValidation.isValid) {
      setConfirmPasswordError(confirmValidation.error || '');
      confirmPasswordRef.current?.focus();
      return;
    }
    setConfirmPasswordError('');

    transitionTo('pin', 'forward');
  };

  // ── Step 5: PIN Validation & Submit ───────────────────────────────────────

  const handlePinChange = (text: string) => {
    const clean = sanitizePin(text);
    setPin(clean);
    if (pinTouched) {
      const res = validateTransactionPin(clean);
      setPinError(res.isValid ? '' : (res.error || ''));
    }
    if (confirmPinTouched && confirmPin) {
      const matchRes = validateConfirmPin(clean, confirmPin);
      setConfirmPinError(matchRes.isValid ? '' : (matchRes.error || ''));
    }
  };

  const handlePinBlur = () => {
    setFocusedField(null);
    setPinTouched(true);
    const res = validateTransactionPin(pin);
    setPinError(res.isValid ? '' : (res.error || ''));
  };

  const handleConfirmPinChange = (text: string) => {
    const clean = sanitizePin(text);
    setConfirmPin(clean);
    if (confirmPinTouched) {
      const res = validateConfirmPin(pin, clean);
      setConfirmPinError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleConfirmPinBlur = () => {
    setFocusedField(null);
    setConfirmPinTouched(true);
    const res = validateConfirmPin(pin, confirmPin);
    setConfirmPinError(res.isValid ? '' : (res.error || ''));
  };

  const handlePinSubmit = async () => {
    setPinTouched(true);
    setConfirmPinTouched(true);

    const pinValidation = validateTransactionPin(pin);
    if (!pinValidation.isValid) {
      setPinError(pinValidation.error || '');
      pinRef.current?.focus();
      return;
    }
    setPinError('');

    const confirmPinValidation = validateConfirmPin(pin, confirmPin);
    if (!confirmPinValidation.isValid) {
      setConfirmPinError(confirmPinValidation.error || '');
      confirmPinRef.current?.focus();
      return;
    }
    setConfirmPinError('');
    setServiceError('');

    setIsLoading(true);
    const result = await registerAccount({
      phone,
      otp,
      fullName,
      dateOfBirth,
      password,
      pin,
    });
    setIsLoading(false);

    if (result.success) {
      transitionTo('done', 'forward');
      setTimeout(() => {
        onSuccess();
      }, 1600);
    } else {
      setServiceError(result.error || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
    }
  };

  if (!visible) return null;

  const currentStepInfo = step !== 'done' ? STEP_LABELS[step] : null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Ambient background glow */}
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
          {/* Top Section: Header & Step Progress Bar */}
          <View style={styles.topSection}>
            <View style={styles.header}>
              <Pressable
                onPress={handleBackPress}
                disabled={step === 'done'}
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && { opacity: 0.6 },
                  step === 'done' && { opacity: 0 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Quay lại bước trước"
                hitSlop={12}
              >
                <ChevronLeft size={24} color={Palette.light} strokeWidth={2} />
              </Pressable>

              <View style={styles.wordmarkContainer}>
                <BankWordmark variant="splash" width={126} height={36} />
              </View>

              <View style={styles.headerSpacer} />
            </View>

            {/* Segmented Step Progress Indicator (Steps 1–5) */}
            {currentStepInfo && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressStepTag}>
                    BƯỚC {currentStepInfo.stepNum}/5
                  </Text>
                  <Text style={styles.progressStepName}>
                    {currentStepInfo.title}
                  </Text>
                </View>

                <View style={styles.progressSegmentsRow}>
                  {[1, 2, 3, 4, 5].map((segIndex) => {
                    const isCompleted = segIndex < currentStepInfo.stepNum;
                    const isCurrent = segIndex === currentStepInfo.stepNum;
                    return (
                      <View
                        key={segIndex}
                        style={[
                          styles.progressSegment,
                          isCompleted && styles.progressSegmentCompleted,
                          isCurrent && styles.progressSegmentCurrent,
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Center Section: Active Step Form */}
          <Animated.View
            style={[
              styles.stepWrapper,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            {/* ── Step 1: Phone ── */}
            {step === 'phone' && (
              <View style={styles.stepCard}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Số điện thoại của bạn</Text>
                  <Text style={styles.subtitle}>
                    7Bank sẽ gửi mã OTP xác thực qua SMS tới số điện thoại này.
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Số điện thoại</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === 'phone' && styles.inputWrapperFocused,
                      Boolean(phoneError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        phoneRef.current = el;
                      }}
                      style={styles.input}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={handlePhoneBlur}
                      placeholder="Nhập số điện thoại"
                      placeholderTextColor={Palette.secondary}
                      keyboardType="phone-pad"
                      autoFocus
                      maxLength={10}
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      returnKeyType="done"
                      onSubmitEditing={handlePhoneSubmit}
                      accessibilityLabel="Số điện thoại"
                    />
                  </View>
                  {Boolean(phoneError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{phoneError}</Text>
                    </View>
                  )}
                </View>

                {Boolean(serviceError) && <ErrorBanner message={serviceError} />}

                <PrimaryButton
                  label="Gửi mã OTP"
                  onPress={handlePhoneSubmit}
                  isLoading={isLoading}
                />
              </View>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 'otp' && (
              <View style={styles.stepCard}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Nhập mã xác thực OTP</Text>
                  <Text style={styles.subtitle}>
                    Mã 6 chữ số vừa được gửi tới số{' '}
                    <Text style={{ color: Palette.light, fontWeight: '600' }}>{phone}</Text>
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mã xác thực</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.otpWrapper,
                      focusedField === 'otp' && styles.inputWrapperFocused,
                      Boolean(otpError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        otpRef.current = el;
                      }}
                      style={styles.otpInput}
                      value={otp}
                      onChangeText={handleOtpChange}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nhập mã xác thực"
                      placeholderTextColor={Palette.secondary}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                      returnKeyType="done"
                      onSubmitEditing={handleOtpSubmit}
                      accessibilityLabel="Mã OTP 6 chữ số"
                    />
                  </View>
                  {Boolean(otpError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{otpError}</Text>
                    </View>
                  )}
                </View>

                {/* Discrete Demo Quick Fill Pill */}
                <Pressable
                  onPress={() => {
                    setOtp('123456');
                    setOtpError('');
                    setServiceError('');
                  }}
                  style={({ pressed }) => [
                    styles.demoPill,
                    pressed && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Điền mã OTP thử nghiệm"
                  hitSlop={6}
                >
                  <Sparkles size={12} color={Palette.secondary} strokeWidth={1.8} />
                  <Text style={styles.demoPillText}>
                    Mã thử nghiệm: <Text style={styles.demoPillBold}>123456</Text> • Chạm để điền nhanh
                  </Text>
                </Pressable>

                {Boolean(serviceError) && <ErrorBanner message={serviceError} />}

                <PrimaryButton
                  label="Xác nhận OTP"
                  onPress={handleOtpSubmit}
                  isLoading={isLoading}
                />
              </View>
            )}

            {/* ── Step 3: Personal Information ── */}
            {step === 'info' && (
              <View style={styles.stepCard}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Thông tin cá nhân</Text>
                  <Text style={styles.subtitle}>
                    Thông tin định danh để quản lý tài khoản 7Bank của bạn an toàn.
                  </Text>
                </View>

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Họ và tên</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === 'name' && styles.inputWrapperFocused,
                      Boolean(fullNameError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        fullNameRef.current = el;
                      }}
                      style={styles.input}
                      value={fullName}
                      onChangeText={handleFullNameChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={handleFullNameBlur}
                      placeholder="Nhập họ và tên"
                      placeholderTextColor={Palette.secondary}
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoComplete="name"
                      textContentType="name"
                      returnKeyType="next"
                      onSubmitEditing={() => dobRef.current?.focus()}
                      accessibilityLabel="Họ và tên"
                    />
                  </View>
                  {Boolean(fullNameError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{fullNameError}</Text>
                    </View>
                  )}
                </View>

                {/* Date of Birth */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Ngày sinh</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === 'dob' && styles.inputWrapperFocused,
                      Boolean(dateOfBirthError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        dobRef.current = el;
                      }}
                      style={styles.input}
                      value={dateOfBirth}
                      onChangeText={handleDobChange}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={handleDobBlur}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={Palette.secondary}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      autoComplete="birthdate-full"
                      returnKeyType="done"
                      onSubmitEditing={handleInfoSubmit}
                      accessibilityLabel="Ngày sinh theo định dạng ngày tháng năm"
                    />
                  </View>
                  {Boolean(dateOfBirthError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{dateOfBirthError}</Text>
                    </View>
                  )}
                </View>

                {Boolean(serviceError) && <ErrorBanner message={serviceError} />}

                <PrimaryButton
                  label="Tiếp tục"
                  onPress={handleInfoSubmit}
                  isLoading={false}
                />
              </View>
            )}

            {/* ── Step 4: Password ── */}
            {step === 'password' && (
              <View style={styles.stepCard}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Tạo mật khẩu đăng nhập</Text>
                  <Text style={styles.subtitle}>
                    Mật khẩu gồm ít nhất 8 ký tự, kết hợp chữ và số để bảo vệ tài khoản.
                  </Text>
                </View>

                {/* Password Input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mật khẩu</Text>
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
                        passwordRef.current = el;
                      }}
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={handlePasswordChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={handlePasswordBlur}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor={Palette.secondary}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      accessibilityLabel="Mật khẩu mới"
                    />
                    <Pressable
                      onPress={() => setShowPassword((p) => !p)}
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

                {/* Live Password Requirement Indicators */}
                <View style={styles.criteriaContainer}>
                  <Text style={styles.criteriaHeader}>Yêu cầu mật khẩu an toàn:</Text>
                  <View style={styles.criteriaGrid}>
                    <CriteriaItem
                      satisfied={passwordCriteria.hasMinLength}
                      label="Tối thiểu 8 ký tự"
                    />
                    <CriteriaItem
                      satisfied={passwordCriteria.hasUppercase}
                      label="Chữ in hoa (A-Z)"
                    />
                    <CriteriaItem
                      satisfied={passwordCriteria.hasLowercase}
                      label="Chữ thường (a-z)"
                    />
                    <CriteriaItem
                      satisfied={passwordCriteria.hasDigit}
                      label="Chữ số (0-9)"
                    />
                    <CriteriaItem
                      satisfied={passwordCriteria.hasSpecial}
                      label="Ký tự đặc biệt (!@#$%...)"
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Xác nhận mật khẩu</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.passwordWrapper,
                      focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                      Boolean(confirmPasswordError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        confirmPasswordRef.current = el;
                      }}
                      style={[styles.input, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={handleConfirmPasswordBlur}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor={Palette.secondary}
                      secureTextEntry={!showConfirmPassword}
                      returnKeyType="done"
                      onSubmitEditing={handlePasswordSubmit}
                      accessibilityLabel="Xác nhận lại mật khẩu"
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword((p) => !p)}
                      hitSlop={10}
                      style={styles.eyeBtn}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color={Palette.secondary} strokeWidth={1.8} />
                      ) : (
                        <Eye size={18} color={Palette.secondary} strokeWidth={1.8} />
                      )}
                    </Pressable>
                  </View>
                  {Boolean(confirmPasswordError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                    </View>
                  )}
                </View>

                {Boolean(serviceError) && <ErrorBanner message={serviceError} />}

                <PrimaryButton
                  label="Tiếp tục"
                  onPress={handlePasswordSubmit}
                  isLoading={false}
                />
              </View>
            )}

            {/* ── Step 5: Transaction PIN Setup & Confirmation ── */}
            {step === 'pin' && (
              <View style={styles.stepCard}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Mã PIN giao dịch</Text>
                  <Text style={styles.subtitle}>
                    Mã 6 chữ số dùng để xác nhận chuyển tiền và thanh toán quan trọng.
                  </Text>
                </View>

                {/* PIN Input */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelWithIconRow}>
                    <Lock size={13} color={Palette.secondary} strokeWidth={2} />
                    <Text style={styles.fieldLabel}>Mã PIN giao dịch</Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.otpWrapper,
                      focusedField === 'pin' && styles.inputWrapperFocused,
                      Boolean(pinError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        pinRef.current = el;
                      }}
                      style={styles.otpInput}
                      value={pin}
                      onChangeText={handlePinChange}
                      onFocus={() => setFocusedField('pin')}
                      onBlur={handlePinBlur}
                      placeholder="Nhập mã PIN gồm 6 số"
                      placeholderTextColor={Palette.secondary}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={6}
                      autoFocus
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPinRef.current?.focus()}
                      accessibilityLabel="Mã PIN giao dịch 6 số"
                    />
                  </View>
                  {Boolean(pinError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{pinError}</Text>
                    </View>
                  )}
                </View>

                {/* Confirm PIN Input */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelWithIconRow}>
                    <ShieldCheck size={13} color={Palette.secondary} strokeWidth={2} />
                    <Text style={styles.fieldLabel}>Xác nhận mã PIN</Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.otpWrapper,
                      focusedField === 'confirmPin' && styles.inputWrapperFocused,
                      Boolean(confirmPinError) && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        confirmPinRef.current = el;
                      }}
                      style={styles.otpInput}
                      value={confirmPin}
                      onChangeText={handleConfirmPinChange}
                      onFocus={() => setFocusedField('confirmPin')}
                      onBlur={handleConfirmPinBlur}
                      placeholder="Nhập lại mã PIN"
                      placeholderTextColor={Palette.secondary}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handlePinSubmit}
                      accessibilityLabel="Xác nhận mã PIN 6 số"
                    />
                  </View>
                  {Boolean(confirmPinError) && (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={13} color={Palette.error} strokeWidth={2} />
                      <Text style={styles.fieldErrorText}>{confirmPinError}</Text>
                    </View>
                  )}
                </View>

                {Boolean(serviceError) && <ErrorBanner message={serviceError} />}

                <PrimaryButton
                  label="Hoàn tất đăng ký"
                  onPress={handlePinSubmit}
                  isLoading={isLoading}
                />
              </View>
            )}

            {/* ── Step 6: Completion Screen ── */}
            {step === 'done' && (
              <View style={styles.doneContainer}>
                <View style={styles.doneBadge}>
                  <CheckCircle2 size={54} color={Palette.incomeGreen} strokeWidth={2} />
                </View>

                <View style={styles.doneTextContainer}>
                  <Text style={styles.doneTitle}>
                    Chào mừng, {fullName || 'Quý khách'}!
                  </Text>
                  <Text style={styles.doneSubtitle}>
                    Tài khoản 7Bank của bạn đã được khởi tạo thành công.
                  </Text>
                </View>

                <View style={styles.doneLoadingRow}>
                  <ActivityIndicator size="small" color={Palette.secondary} />
                  <Text style={styles.doneLoadingText}>Đang chuyển vào trang chủ...</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Bottom Section: Link back to Sign In */}
          {step === 'phone' && onGoToSignIn && (
            <View style={styles.bottomSection}>
              <View style={styles.signInRow}>
                <Text style={styles.haveAccountText}>Đã có tài khoản?</Text>
                <Pressable
                  onPress={onGoToSignIn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Đăng nhập ngay"
                >
                  <Text style={styles.signInLinkText}>Đăng nhập ngay</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CriteriaItem({ satisfied, label }: { satisfied: boolean; label: string }) {
  return (
    <View style={styles.criteriaItem}>
      {satisfied ? (
        <Check size={13} color={Palette.incomeGreen} strokeWidth={2.5} />
      ) : (
        <Circle size={8} color={Palette.gray500} strokeWidth={2} />
      )}
      <Text
        style={[
          styles.criteriaText,
          satisfied && styles.criteriaTextSatisfied,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  isLoading,
}: {
  label: string;
  onPress: () => void;
  isLoading: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (pressed || isLoading) && styles.primaryBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={['#A8929F', '#6D5A68']}
        style={styles.primaryBtnGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isLoading ? (
          <ActivityIndicator color={Palette.white} size="small" />
        ) : (
          <Text style={styles.primaryBtnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.serviceErrorContainer}>
      <AlertCircle size={15} color={Palette.error} strokeWidth={2} />
      <Text style={styles.serviceErrorText}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Header & Progress ─────────────────────────────────────────────────────
  topSection: {
    gap: Spacing.md,
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
  progressContainer: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStepTag: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.wider,
  },
  progressStepName: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  progressSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(193, 160, 172, 0.16)',
  },
  progressSegmentCompleted: {
    backgroundColor: Palette.primary,
  },
  progressSegmentCurrent: {
    backgroundColor: Palette.light,
  },

  // ── Step Content ──────────────────────────────────────────────────────────
  stepWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  stepCard: {
    gap: Spacing.lg,
  },
  titleContainer: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.title2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    lineHeight: 22,
  },

  // ── Field Layouts ─────────────────────────────────────────────────────────
  fieldGroup: {
    gap: Spacing.xs,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
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
  otpWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 4,
    color: Palette.light,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    width: '100%',
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

  // ── Password Criteria Checklist ───────────────────────────────────────────
  criteriaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.07)',
  },
  criteriaHeader: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    marginBottom: 4,
  },
  criteriaGrid: {
    gap: 6,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criteriaText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
  },
  criteriaTextSatisfied: {
    color: Palette.light,
    fontWeight: Typography.fontWeight.medium,
  },

  // ── Demo Pill ─────────────────────────────────────────────────────────────
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
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

  // ── Service Error Banner ──────────────────────────────────────────────────
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

  // ── Primary Action Button ─────────────────────────────────────────────────
  primaryBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  primaryBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  primaryBtnGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },

  // ── Completion Step ───────────────────────────────────────────────────────
  doneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  doneBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTextContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  doneTitle: {
    fontSize: Typography.fontSize.title1,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  doneLoadingText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },

  // ── Bottom Section ────────────────────────────────────────────────────────
  bottomSection: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  haveAccountText: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
  },
  signInLinkText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    textDecorationLine: 'underline',
  },
});
