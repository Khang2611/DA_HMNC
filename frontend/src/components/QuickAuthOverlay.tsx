/**
 * QuickAuthOverlay.tsx — Locked Home Authentication Surface
 *
 * Displayed when a returning user opens the app.
 * Overlays the Home screen (blurred/redacted content below).
 * Supports biometric (simulated) and password fallback.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Fingerprint, AlertCircle, LogOut } from 'lucide-react-native';
import { BankWordmark } from '../components/splash/BankLogoSVG';
import { GlassView } from '../components/GlassView';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import {
  authenticateWithBiometrics,
  unlockWithPassword,
  isBiometricsAvailable,
  signOut,
} from '../services/authService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface QuickAuthOverlayProps {
  visible: boolean;
  userName?: string;
  onAuthSuccess: () => void;
  onSignOut: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const QuickAuthOverlay: React.FC<QuickAuthOverlayProps> = ({
  visible,
  userName = 'Quý Nguyễn',
  onAuthSuccess,
  onSignOut,
}) => {
  const insets = useSafeAreaInsets();

  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(true);

  // useMemo so Animated.Value instances are stable across renders
  const overlayOpacity = useMemo(() => new Animated.Value(0), []);
  const cardTranslateY = useMemo(() => new Animated.Value(60), []);
  const cardOpacity = useMemo(() => new Animated.Value(0), []);
  const exitOpacity = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    isBiometricsAvailable().then(setBiometricsAvailable);
  }, []);

  // dismissWithSuccess — declared FIRST so handleBiometricAuth can reference it
  const dismissWithSuccess = useCallback(() => {
    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      exitOpacity.setValue(1);
      onAuthSuccess();
    });
  }, [exitOpacity, cardTranslateY, onAuthSuccess]);

  // Biometric auth handler — declared after dismissWithSuccess
  const handleBiometricAuth = useCallback(async () => {
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    const result = await authenticateWithBiometrics();
    setIsLoading(false);

    if (result.success) {
      dismissWithSuccess();
    } else {
      setError(result.error || 'Xác thực thất bại.');
      setShowPasswordFallback(true);
    }
  }, [isLoading, dismissWithSuccess]);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      cardTranslateY.setValue(60);
      cardOpacity.setValue(0);
      // Reset state without direct setState in effect body
      const timer = setTimeout(() => {
        setShowPasswordFallback(false);
        setPassword('');
        setError('');
      }, 0);
      return () => clearTimeout(timer);
    }

    const ease = Easing.bezier(0.25, 0.46, 0.45, 0.94);
    const easeOut = Easing.bezier(0.0, 0.0, 0.2, 1.0);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 450,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        easing: ease,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-trigger biometric prompt after a short delay
    if (biometricsAvailable) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 600);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [visible, biometricsAvailable, overlayOpacity, cardTranslateY, cardOpacity, handleBiometricAuth]);

  const handlePasswordAuth = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    setError('');
    setIsLoading(true);
    const result = await unlockWithPassword(password);
    setIsLoading(false);

    if (result.success) {
      dismissWithSuccess();
    } else {
      setError(result.error || 'Mật khẩu không đúng.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  if (!visible) return null;

  // Extract first name
  const firstName = userName.split(' ').pop() || userName;

  return (
    <Animated.View style={[styles.root, { opacity: overlayOpacity }]}>
      <StatusBar style="light" />

      {/* Semi-transparent dark overlay */}
      <LinearGradient
        colors={[Palette.bg, 'rgba(22,19,31,0.97)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Auth card */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
            paddingBottom: insets.bottom + Spacing.xxxl,
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <BankWordmark variant="splash" width={126} height={36} />
        </View>

        {/* Avatar + greeting */}
        <GlassView variant="card" borderRadius={Radius.xl} style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.greeting}>Chào mừng trở lại,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </GlassView>

        {/* Biometric button */}
        {biometricsAvailable && !showPasswordFallback && (
          <View style={styles.biometricSection}>
            <Pressable
              onPress={handleBiometricAuth}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.biometricBtn,
                (pressed || isLoading) && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Xác thực sinh trắc học"
            >
              {isLoading ? (
                <ActivityIndicator color={Palette.light} size="small" />
              ) : (
                <>
                  <Fingerprint size={32} color={Palette.light} strokeWidth={1.5} />
                  <Text style={styles.biometricLabel}>Mở khóa bằng sinh trắc học</Text>
                </>
              )}
            </Pressable>

            {error ? <ErrorRow message={error} /> : null}

            <Pressable
              onPress={() => setShowPasswordFallback(true)}
              hitSlop={8}
              style={styles.passwordFallbackLink}
            >
              <Text style={styles.passwordFallbackText}>Dùng mật khẩu</Text>
            </Pressable>
          </View>
        )}

        {/* Password fallback */}
        {showPasswordFallback && (
          <View style={styles.passwordSection}>
            <Text style={styles.passwordLabel}>Nhập mật khẩu để mở khóa</Text>
            <GlassView variant="card" borderRadius={Radius.md} style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={Palette.secondary}
                secureTextEntry={!showPassword}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handlePasswordAuth}
                accessibilityLabel="Mật khẩu để mở khóa"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={{ padding: Spacing.sm }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Palette.secondary} strokeWidth={1.75} />
                ) : (
                  <Eye size={18} color={Palette.secondary} strokeWidth={1.75} />
                )}
              </Pressable>
            </GlassView>

            {error ? <ErrorRow message={error} /> : null}

            <Pressable
              onPress={handlePasswordAuth}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.unlockBtn,
                (pressed || isLoading) && { opacity: 0.75 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mở khóa"
            >
              <LinearGradient
                colors={['#806C79', '#5A4A5A']}
                style={styles.unlockGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Palette.white} size="small" />
                ) : (
                  <Text style={styles.unlockText}>Mở khóa</Text>
                )}
              </LinearGradient>
            </Pressable>

            {biometricsAvailable && (
              <Pressable
                onPress={() => { setShowPasswordFallback(false); handleBiometricAuth(); }}
                hitSlop={8}
                style={styles.passwordFallbackLink}
              >
                <Fingerprint size={16} color={Palette.secondary} strokeWidth={1.75} />
                <Text style={styles.passwordFallbackText}>Dùng sinh trắc học</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
        >
          <LogOut size={15} color={Palette.secondary} strokeWidth={1.75} />
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

function ErrorRow({ message }: { message: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
      <AlertCircle size={14} color={Palette.error} strokeWidth={2} />
      <Text style={{ fontSize: Typography.fontSize.caption1, color: Palette.error, flex: 1 }}>
        {message}
      </Text>
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
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  logoRow: {
    alignItems: 'center',
  },
  avatarCard: {
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(193, 160, 172, 0.3)',
    marginBottom: Spacing.sm,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },
  greeting: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
  userName: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    letterSpacing: Typography.letterSpacing.tight,
  },
  biometricSection: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  biometricBtn: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
    width: '100%',
  },
  biometricLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.light,
    fontWeight: Typography.fontWeight.medium,
  },
  passwordFallbackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  passwordFallbackText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textDecorationLine: 'underline',
  },
  passwordSection: {
    width: '100%',
    gap: Spacing.md,
  },
  passwordLabel: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    minHeight: 52,
  },
  input: {
    fontSize: Typography.fontSize.callout,
    color: Palette.light,
    paddingVertical: Spacing.md,
  },
  unlockBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  unlockGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  unlockText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  signOutText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
  },
});
