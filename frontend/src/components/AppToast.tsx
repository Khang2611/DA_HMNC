/**
 * AppToast.tsx — Standardized Lightweight Toast Notification
 *
 * Used for trivial, non-blocking actions such as:
 * - Copying account number, VietQR link, hotline, email
 * - Quick toggles & subtle auto-dismiss alerts
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';

export interface AppToastProps {
  visible: boolean;
  message: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  duration?: number;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

export const AppToast: React.FC<AppToastProps> = ({
  visible,
  message,
  icon: IconComponent = Check,
  duration = 2500,
  onDismiss,
  position = 'top',
}) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const topOffset = insets.top + Spacing.sm;
  const bottomOffset = Math.max(insets.bottom, Spacing.lg) + Spacing.lg;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.toastWrapper,
        position === 'top' ? { top: topOffset } : { bottom: bottomOffset },
      ]}
    >
      <Pressable onPress={onDismiss} style={styles.toastPressable}>
        <GlassView
          variant="card"
          borderRadius={Radius.pill}
          style={styles.toastContainer}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(30, 24, 38, 0.90)',
                borderRadius: Radius.pill,
              },
            ]}
          />
          <View style={styles.iconCircle}>
            <IconComponent size={14} color={Palette.incomeGreen} strokeWidth={2.5} />
          </View>
          <Text style={styles.toastText} numberOfLines={2}>
            {message}
          </Text>
        </GlassView>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toastPressable: {
    maxWidth: '100%',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(52, 199, 89, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  toastText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
    letterSpacing: 0.2,
  },
});
