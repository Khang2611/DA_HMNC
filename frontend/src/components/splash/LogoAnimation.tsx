/**
 * LogoAnimation.tsx — Authoritative 7Bank Animated Logo (7. → bank)
 *
 * Sequence:
 *   Phase 0 (0–400ms):     "7." fades + scales in at the center of viewport
 *   Phase 1 (400–1200ms):  "7." fluidly rotates 90° and translates into position,
 *                          becoming the custom "n" of the wordmark
 *   Phase 2 (1200–1800ms): "ba" slides in from left, "k" slides in from right
 *   Phase 3 (1800–2200ms): Complete "bank" wordmark settles
 *   Phase 4 (2200ms+):     onComplete callback fires
 *
 * Built with React Native Animated API — strictly GPU native driver transforms.
 * Single geometric source: the 7. and custom n use the EXACT SAME SVG path.
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PATH_BA, PATH_N, PATH_K, SPLASH_COLORS } from './BankLogoSVG';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface LogoAnimationProps {
  onComplete?: () => void;
  skipAnimation?: boolean;
  size?: number; // Height of the logo in dp (width scales at 3.52:1)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const LogoAnimation: React.FC<LogoAnimationProps> = ({
  onComplete,
  skipAnimation = false,
  size = 64,
}) => {
  // Proportional sizing based on 500×142 aspect ratio (3.521:1)
  const logoHeight = Math.max(size, 48);
  const logoWidth = Math.round(logoHeight * (500 / 142));
  const scaleRatio = logoWidth / 500;

  // Offset from n center (310, 83.5) to container center (250, 71)
  const initialOffsetDx = -60 * scaleRatio;
  const initialOffsetDy = -12.5 * scaleRatio;

  // Animated values (useMemo avoids react-hooks/refs linter error)
  const symbolOpacity = useMemo(() => new Animated.Value(0), []);
  const symbolScale = useMemo(() => new Animated.Value(0.85), []);
  const symbolMorph = useMemo(() => new Animated.Value(1), []); // 1 = 7. state (90deg, centered), 0 = n state (0deg, wordmark position)

  const baOpacity = useMemo(() => new Animated.Value(0), []);
  const baTranslateX = useMemo(() => new Animated.Value(-35), []);

  const kOpacity = useMemo(() => new Animated.Value(0), []);
  const kTranslateX = useMemo(() => new Animated.Value(35), []);

  const wordmarkScale = useMemo(() => new Animated.Value(1), []);

  const runAnimation = useCallback(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion || skipAnimation) {
        symbolOpacity.setValue(1);
        symbolScale.setValue(1);
        symbolMorph.setValue(0);
        baOpacity.setValue(1);
        baTranslateX.setValue(0);
        kOpacity.setValue(1);
        kTranslateX.setValue(0);
        wordmarkScale.setValue(1);
        onComplete?.();
        return;
      }

      const ease = Easing.bezier(0.25, 0.46, 0.45, 0.94);
      const easeOut = Easing.bezier(0.0, 0.0, 0.2, 1.0);
      const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1.0);

      Animated.sequence([
        // Phase 0: "7." appears centered and scales up (0–400ms)
        Animated.parallel([
          Animated.timing(symbolOpacity, {
            toValue: 1,
            duration: 380,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(symbolScale, {
            toValue: 1,
            duration: 400,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),

        // Phase 1: "7." rotates 90° clockwise into "n" and shifts into position (400–1200ms)
        Animated.timing(symbolMorph, {
          toValue: 0,
          duration: 750,
          easing: easeInOut,
          useNativeDriver: true,
        }),

        // Phase 2: "ba" and "k" slide in from their respective sides (1200–1800ms)
        Animated.parallel([
          Animated.timing(baOpacity, {
            toValue: 1,
            duration: 520,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(baTranslateX, {
            toValue: 0,
            duration: 550,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(kOpacity, {
            toValue: 1,
            duration: 520,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(kTranslateX, {
            toValue: 0,
            duration: 550,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),

        // Phase 3: Settle the complete wordmark (1800–2100ms)
        Animated.sequence([
          Animated.timing(wordmarkScale, {
            toValue: 1.03,
            duration: 180,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(wordmarkScale, {
            toValue: 1.0,
            duration: 220,
            easing: easeInOut,
            useNativeDriver: true,
          }),
        ]),

        Animated.delay(200),
      ]).start(() => {
        onComplete?.();
      });
    });
  }, [
    skipAnimation,
    onComplete,
    symbolOpacity,
    symbolScale,
    symbolMorph,
    baOpacity,
    baTranslateX,
    kOpacity,
    kTranslateX,
    wordmarkScale,
  ]);

  useEffect(() => {
    runAnimation();
  }, [runAnimation]);

  // Interpolations for the rotating/translating 7. → n symbol
  const symbolRotateDeg = symbolMorph.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const symbolTranslateXVal = symbolMorph.interpolate({
    inputRange: [0, 1],
    outputRange: [0, initialOffsetDx],
  });

  const symbolTranslateYVal = symbolMorph.interpolate({
    inputRange: [0, 1],
    outputRange: [0, initialOffsetDy],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: logoWidth,
          height: logoHeight,
          transform: [{ scale: wordmarkScale }],
        },
      ]}
      accessibilityLabel="7Bank logo animation"
    >
      {/* ── Layer 1: "ba" letters (enters from left in Phase 2) ── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: baOpacity,
            transform: [{ translateX: baTranslateX }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={logoWidth} height={logoHeight} viewBox="0 0 500 142">
          <Path
            d={PATH_BA}
            fill={SPLASH_COLORS.primary}
            fillRule="evenodd"
          />
        </Svg>
      </Animated.View>

      {/* ── Layer 2: The Core "7." → "n" Symbol (Starts 90deg, rotates to 0deg) ── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: symbolOpacity,
            transform: [
              { translateX: symbolTranslateXVal },
              { translateY: symbolTranslateYVal },
              { rotate: symbolRotateDeg },
              { scale: symbolScale },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={logoWidth} height={logoHeight} viewBox="0 0 500 142">
          <Path
            d={PATH_N}
            fill={SPLASH_COLORS.accent}
            fillRule="evenodd"
          />
        </Svg>
      </Animated.View>

      {/* ── Layer 3: "k" letter (enters from right in Phase 2) ── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: kOpacity,
            transform: [{ translateX: kTranslateX }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={logoWidth} height={logoHeight} viewBox="0 0 500 142">
          <Path
            d={PATH_K}
            fill={SPLASH_COLORS.primary}
            fillRule="evenodd"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
