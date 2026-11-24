/**
 * ConfirmationBottomSheet.tsx — Standardized Pre-Action Confirmation Sheet
 *
 * Used for all sensitive / destructive confirmations BEFORE an action:
 * - Deleting budget, savings goal, or recurring expense
 * - Locking or reporting lost cards
 * - Signing out of account or session devices
 * - Cancelling pending operations
 *
 * Modeled after Mauve Banking's "Sắp ra mắt" modal reference:
 * - Slide-up bottom sheet with dimmed backdrop
 * - Drag handle & Liquid Glass surface
 * - Clear title, message, and explicit confirm / cancel actions
 * - Safe area padding & hardware back-button dismiss
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';

export interface ConfirmationBottomSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationBottomSheet: React.FC<ConfirmationBottomSheetProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'danger',
  icon: CustomIcon,
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.lg) + Spacing.lg;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          DefaultIcon: Trash2,
          iconColor: Palette.expenseRed,
          iconBg: 'rgba(255, 69, 58, 0.18)',
          iconBorder: 'rgba(255, 69, 58, 0.35)',
          confirmBtnBg: 'rgba(255, 69, 58, 0.22)',
          confirmBtnBorder: 'rgba(255, 69, 58, 0.40)',
          confirmTextColor: Palette.expenseRed,
        };
      case 'warning':
        return {
          DefaultIcon: AlertTriangle,
          iconColor: Palette.warning,
          iconBg: 'rgba(255, 159, 10, 0.18)',
          iconBorder: 'rgba(255, 159, 10, 0.35)',
          confirmBtnBg: 'rgba(255, 159, 10, 0.22)',
          confirmBtnBorder: 'rgba(255, 159, 10, 0.40)',
          confirmTextColor: Palette.warning,
        };
      case 'primary':
      default:
        return {
          DefaultIcon: HelpCircle,
          iconColor: Palette.light,
          iconBg: 'rgba(128, 108, 121, 0.28)',
          iconBorder: 'rgba(240, 217, 228, 0.30)',
          confirmBtnBg: 'rgba(128, 108, 121, 0.35)',
          confirmBtnBorder: 'rgba(240, 217, 228, 0.25)',
          confirmTextColor: Palette.light,
        };
    }
  };

  const {
    DefaultIcon,
    iconColor,
    iconBg,
    iconBorder,
    confirmBtnBg,
    confirmBtnBorder,
    confirmTextColor,
  } = getVariantStyles();

  const IconComponent = CustomIcon || DefaultIcon;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheetOuter, { paddingBottom: bottomPad }]}
          onPress={(e) => e.stopPropagation()}
        >
          <GlassView
            variant="card"
            borderRadius={Radius.xxl}
            style={styles.sheet}
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

            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Icon */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: iconBg,
                  borderColor: iconBorder,
                },
              ]}
            >
              <IconComponent size={30} color={iconColor} strokeWidth={1.8} />
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            {/* Message Body */}
            <Text style={styles.body}>{message}</Text>

            {/* Actions: Cancel & Confirm */}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <GlassView
                  variant="dark"
                  useBlur={false}
                  borderRadius={Radius.lg}
                  style={styles.cancelBtnInner}
                >
                  <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
                </GlassView>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                <View
                  style={[
                    styles.confirmBtnInner,
                    {
                      backgroundColor: confirmBtnBg,
                      borderColor: confirmBtnBorder,
                    },
                  ]}
                >
                  <Text style={[styles.confirmBtnText, { color: confirmTextColor }]}>
                    {confirmLabel}
                  </Text>
                </View>
              </Pressable>
            </View>
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
    justifyContent: 'flex-end',
  },
  sheetOuter: {
    paddingHorizontal: Spacing.lg,
  },
  sheet: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(193, 160, 172, 0.35)',
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: Typography.fontSize.subheadline,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  cancelBtnInner: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.15)',
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
  confirmBtnInner: {
    width: '100%',
    height: 50,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
  },
});
