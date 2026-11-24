/**
 * AuthTransitionNavigator.tsx — Coordinated Spatial Transitions for 7Bank Auth
 *
 * Coordinates full-screen visual transitions between:
 *   - WelcomeScreen ↔ SignInScreen (forward: slide left + fade; back: slide right + fade)
 *   - WelcomeScreen ↔ SignUpScreen (forward: slide left + fade; back: slide right + fade)
 *   - SignInScreen ↔ SignUpScreen (cross slide + fade)
 *   - Auth Flow → Home (dissolve + subtle scale into authenticated app)
 *
 * Honors AccessibilityInfo.isReduceMotionEnabled().
 * Prevents intermediate flashes and ensures screens mount before transitions.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { WelcomeScreen } from '../../screens/WelcomeScreen';
import { SignInScreen } from '../../screens/SignInScreen';
import { SignUpScreen } from '../../screens/SignUpScreen';
import { Palette } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AuthScreenType = 'welcome' | 'sign_in' | 'sign_up';

interface AuthTransitionNavigatorProps {
  initialScreen?: AuthScreenType;
  onAuthSuccess: () => void;
  onForgotPassword?: () => void;
}

export const AuthTransitionNavigator: React.FC<AuthTransitionNavigatorProps> = ({
  initialScreen = 'welcome',
  onAuthSuccess,
  onForgotPassword,
}) => {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>(initialScreen);
  const [prevScreen, setPrevScreen] = useState<AuthScreenType | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation values
  const transitionProgress = useMemo(() => new Animated.Value(1), []);
  const exitProgress = useMemo(() => new Animated.Value(0), []);

  // Check accessibility reduce-motion setting
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReduceMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);


  // Navigate with directional animation
  const navigateTo = useCallback(
    (nextScreen: AuthScreenType, navDirection: 'forward' | 'backward') => {
      if (nextScreen === currentScreen) return;

      if (reduceMotion) {
        setPrevScreen(null);
        setCurrentScreen(nextScreen);
        return;
      }

      setPrevScreen(currentScreen);
      setCurrentScreen(nextScreen);
      setDirection(navDirection);
      transitionProgress.setValue(0);

      Animated.timing(transitionProgress, {
        toValue: 1,
        duration: 320,
        easing: Easing.bezier(0.2, 0.0, 0.0, 1.0),
        useNativeDriver: true,
      }).start(() => {
        setPrevScreen(null);
      });
    },
    [currentScreen, reduceMotion, transitionProgress]
  );

  // Success transition into Home
  const handleSuccess = useCallback(() => {
    if (reduceMotion) {
      onAuthSuccess();
      return;
    }

    Animated.timing(exitProgress, {
      toValue: 1,
      duration: 320,
      easing: Easing.bezier(0.2, 0.0, 0.0, 1.0),
      useNativeDriver: true,
    }).start(() => {
      onAuthSuccess();
    });
  }, [reduceMotion, exitProgress, onAuthSuccess]);

  // Interpolations for transitions
  const outgoingTranslateX = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      direction === 'forward' ? -SCREEN_WIDTH * 0.28 : SCREEN_WIDTH,
    ],
  });

  const outgoingOpacity = transitionProgress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.3, 0],
  });

  const incomingTranslateX = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH * 0.28,
      0,
    ],
  });

  const incomingOpacity = transitionProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.2, 0.7, 1],
  });

  // Overall exit to Home
  const containerOpacity = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const containerScale = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

  // Helper to render individual screens
  const renderScreen = (screenType: AuthScreenType) => {
    switch (screenType) {
      case 'welcome':
        return (
          <WelcomeScreen
            visible={true}
            onSignIn={() => navigateTo('sign_in', 'forward')}
            onSignUp={() => navigateTo('sign_up', 'forward')}
          />
        );
      case 'sign_in':
        return (
          <SignInScreen
            visible={true}
            onBack={() => navigateTo('welcome', 'backward')}
            onSuccess={handleSuccess}
            onForgotPassword={onForgotPassword}
            onGoToSignUp={() => navigateTo('sign_up', 'forward')}
          />
        );
      case 'sign_up':
        return (
          <SignUpScreen
            visible={true}
            onBack={() => navigateTo('welcome', 'backward')}
            onSuccess={handleSuccess}
            onGoToSignIn={() => navigateTo('sign_in', 'backward')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      {/* Outgoing Screen Layer during active transition */}
      {prevScreen !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.screenLayer,
            {
              transform: [{ translateX: outgoingTranslateX }],
              opacity: outgoingOpacity,
              zIndex: direction === 'forward' ? 1 : 2,
            },
          ]}
        >
          {renderScreen(prevScreen)}
        </Animated.View>
      )}

      {/* Incoming / Active Screen Layer */}
      <Animated.View
        style={[
          styles.screenLayer,
          prevScreen !== null
            ? {
                transform: [{ translateX: incomingTranslateX }],
                opacity: incomingOpacity,
                zIndex: direction === 'forward' ? 2 : 1,
              }
            : styles.settledLayer,
        ]}
      >
        {renderScreen(currentScreen)}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.bg,
    zIndex: 50,
  },
  screenLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.bg,
  },
  settledLayer: {
    zIndex: 1,
    opacity: 1,
  },
});
