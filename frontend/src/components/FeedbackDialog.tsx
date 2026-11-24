/**
 * FeedbackDialog.tsx — Centered Feedback Dialog for Mauve Banking
 *
 * Used for all post-action feedback:
 * - Successfully deleted / saved / updated / locked / unlocked
 * - Failed operations / validation errors
 * - Important warnings & informational notices
 *
 * Features:
 * - Centered on screen with dimmed backdrop
 * - Apple-inspired Liquid Glass card with Mauve Moonscape aesthetic
 * - Lucide icons with variant-specific color accents
 * - Responsive layout & safe-area handling
 * - Hardware back-button dismiss on Android
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackDialogProps {
  visible: boolean;
  variant?: FeedbackVariant;
  title: string;
  message?: string;
  buttonLabel?: string;
  onClose: () => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  visible,
  variant = 'info',
  title,
  message,
  buttonLabel = 'Đồng ý',
  onClose,
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          Icon: CheckCircle2,
          iconColor: Palette.incomeGreen,
          iconBg: 'rgba(52, 199, 89, 0.18)',
          iconBorder: 'rgba(52, 199, 89, 0.35)',
        };
      case 'error':
        return {
          Icon: AlertCircle,
          iconColor: Palette.expenseRed,
          iconBg: 'rgba(255, 69, 58, 0.18)',
          iconBorder: 'rgba(255, 69, 58, 0.35)',
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          iconColor: Palette.warning,
          iconBg: 'rgba(255, 159, 10, 0.18)',
          iconBorder: 'rgba(255, 159, 10, 0.35)',
        };
      case 'info':
      default:
        return {
          Icon: Info,
          iconColor: Palette.light,
          iconBg: 'rgba(128, 108, 121, 0.28)',
          iconBorder: 'rgba(240, 217, 228, 0.30)',
        };
    }
  };

  const { Icon, iconColor, iconBg, iconBorder } = getVariantConfig();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.cardOuter} onPress={(e) => e.stopPropagation()}>
          <GlassView
            variant="card"
            borderRadius={Radius.xxl}
            style={styles.card}
          >
            {/* Mauve overlay tint */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(30, 24, 38, 0.78)',
                  borderRadius: Radius.xxl,
                },
              ]}
            />

            {/* Icon Circle */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: iconBg,
                  borderColor: iconBorder,
                },
              ]}
            >
              <Icon size={32} color={iconColor} strokeWidth={1.8} />
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            {/* Message Body */}
            {message ? (
              <Text style={styles.message}>{message}</Text>
            ) : null}

            {/* Acknowledgment Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel={buttonLabel}
            >
              <GlassView
                variant="dark"
                luminousBorder
                useBlur={false}
                borderRadius={Radius.lg}
                style={styles.btnInner}
              >
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: 'rgba(128, 108, 121, 0.35)',
                      borderRadius: Radius.lg,
                    },
                  ]}
                />
                <Text style={styles.btnText}>{buttonLabel}</Text>
              </GlassView>
            </Pressable>
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  cardOuter: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.title3,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  btn: {
    width: '100%',
    height: 50,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  btnInner: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    letterSpacing: 0.2,
  },
});
