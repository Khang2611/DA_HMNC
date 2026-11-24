/**
 * WelcomeScreen.tsx — First Launch Welcome Screen
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BankWordmark } from '../components/splash/BankLogoSVG';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
  onSignIn: () => void;
  onSignUp: () => void;
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSignIn,
  onSignUp,
  visible,
}) => {
  const insets = useSafeAreaInsets();

  // useMemo — Animated.Value instances, stable across renders
  const containerOpacity = useMemo(() => new Animated.Value(1), []);
  const logoTranslateY = useMemo(() => new Animated.Value(-24), []);
  const taglineOpacity = useMemo(() => new Animated.Value(0), []);
  const taglineTranslateY = useMemo(() => new Animated.Value(16), []);
  const ctaOpacity = useMemo(() => new Animated.Value(0), []);
  const ctaTranslateY = useMemo(() => new Animated.Value(24), []);

  useEffect(() => {
    if (!visible) return;

    const ease = Easing.bezier(0.25, 0.46, 0.45, 0.94);
    const easeOut = Easing.bezier(0.0, 0.0, 0.2, 1.0);

    logoTranslateY.setValue(-24);
    taglineOpacity.setValue(0);
    taglineTranslateY.setValue(16);
    ctaOpacity.setValue(0);
    ctaTranslateY.setValue(24);

    Animated.sequence([
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 450,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 350,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 350,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(ctaTranslateY, {
          toValue: 0,
          duration: 350,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    visible,
    logoTranslateY,
    taglineOpacity,
    taglineTranslateY,
    ctaOpacity,
    ctaTranslateY,
  ]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.root, { opacity: containerOpacity }]}
      accessibilityLabel="Màn hình chào mừng 7Bank"
    >
      <StatusBar style="light" />

      <LinearGradient
        colors={[Palette.upperSurface, Palette.bg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Logo area */}
      <View style={[styles.logoSection, { paddingTop: insets.top + 80 }]}>
        <Animated.View style={{ transform: [{ translateY: logoTranslateY }] }}>
          <BankWordmark variant="splash" width={180} height={52} />
        </Animated.View>

        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.tagline}>Ngân hàng thế hệ mới</Text>
          <Text style={styles.taglineSub}>An toàn · Thông minh · Phong cách</Text>
        </Animated.View>
      </View>

      {/* CTA area */}
      <Animated.View
        style={[
          styles.ctaSection,
          {
            opacity: ctaOpacity,
            transform: [{ translateY: ctaTranslateY }],
            paddingBottom: insets.bottom + Spacing.xxxl,
          },
        ]}
      >
        <Pressable
          onPress={onSignUp}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Mở tài khoản mới"
        >
          <LinearGradient
            colors={['#A8929F', '#6D5A68']}
            style={styles.primaryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.primaryBtnText}>Mở tài khoản</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={onSignIn}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Đăng nhập vào tài khoản"
        >
          <Text style={styles.secondaryBtnText}>Đăng nhập</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <Text style={styles.disclaimerLink}>Điều khoản sử dụng</Text>
          {' '}và{' '}
          <Text style={styles.disclaimerLink}>Chính sách bảo mật</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
    ...StyleSheet.absoluteFill,
    zIndex: 50,
  },
  ambientGlow: {
    position: 'absolute',
    top: -80,
    left: (SCREEN_WIDTH - 400) / 2,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(128, 108, 121, 0.12)',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  taglineContainer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.tight,
  },
  taglineSub: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.regular,
    color: Palette.secondary,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
  },
  ctaSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.3)',
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
  btnPressed: {
    opacity: 0.75,
  },
  disclaimer: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  disclaimerLink: {
    color: Palette.primary,
    textDecorationLine: 'underline',
  },
});
