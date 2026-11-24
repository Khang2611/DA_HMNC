/**
 * AnimatedSplashScreen.tsx — Full-Screen Branded Splash
 *
 * Shows the dark Moonscape background with the 7.→bank animation.
 * Transitions out seamlessly once the logo animation completes.
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LogoAnimation } from './LogoAnimation';
import { Palette } from '../../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedSplashScreenProps {
  onLogoComplete: () => void;
  onDismissed: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onLogoComplete,
  onDismissed,
}) => {
  const screenOpacity = useMemo(() => new Animated.Value(1), []);
  const logoScale = useMemo(() => new Animated.Value(1), []);
  const logoTranslateY = useMemo(() => new Animated.Value(0), []);
  const glowOpacity = useMemo(() => new Animated.Value(0), []);

  // Start ambient glow immediately
  useEffect(() => {
    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [glowOpacity]);

  const handleLogoComplete = useCallback(() => {
    // 1. Notify coordinator so the destination screen renders underneath
    onLogoComplete();

    // 2. Smoothly dissolve splash overlay
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: -16,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.03,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 3. Splash is completely transparent; safe to unmount
      onDismissed();
    });
  }, [onLogoComplete, onDismissed, screenOpacity, logoTranslateY, logoScale]);

  return (
    <Animated.View
      style={[styles.root, { opacity: screenOpacity }]}
      accessibilityLabel="7Bank splash screen"
      accessibilityLiveRegion="polite"
    >
      <StatusBar style="light" />

      {/* Ambient radial glow — purely decorative */}
      <Animated.View
        style={[styles.ambientGlow, { opacity: glowOpacity }]}
        pointerEvents="none"
      />

      {/* Centered Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { translateY: logoTranslateY },
              { scale: logoScale },
            ],
          },
        ]}
      >
        <LogoAnimation onComplete={handleLogoComplete} size={68} />
      </Animated.View>

      {/* Subtle circular arc lines (decorative) */}
      <View style={styles.arcContainer} pointerEvents="none">
        <View style={styles.arcOuter} />
        <View style={styles.arcInner} />
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const GLOW_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 1.2;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: Palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  ambientGlow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: 'rgba(128, 108, 121, 0.14)',
    top: (SCREEN_HEIGHT - GLOW_SIZE) / 2,
    left: (SCREEN_WIDTH - GLOW_SIZE) / 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcOuter: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: SCREEN_WIDTH * 0.425,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.06)',
  },
  arcInner: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: SCREEN_WIDTH * 0.325,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.04)',
  },
});
