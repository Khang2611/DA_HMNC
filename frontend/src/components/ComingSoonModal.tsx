/**
 * ComingSoonModal — Reusable glass bottom sheet for unimplemented products.
 * Consistent with Mauve Moonscape Liquid Glass aesthetic.
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
import { Sparkles, X } from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';

interface ComingSoonModalProps {
  visible: boolean;
  productName?: string;
  onClose: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  visible,
  productName,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.lg) + Spacing.lg;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dark translucent backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Sheet — stop press propagation so tapping content doesn't close */}
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
                  backgroundColor: 'rgba(30, 24, 38, 0.72)',
                  borderRadius: Radius.xxl,
                },
              ]}
            />

            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Close button */}
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <X size={18} color={Palette.secondary} strokeWidth={2} />
            </Pressable>

            {/* Icon */}
            <View style={styles.iconCircle}>
              <Sparkles size={30} color={Palette.light} strokeWidth={1.75} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Sắp ra mắt</Text>

            {/* Body */}
            <Text style={styles.body}>
              {productName ? (
                <>
                  <Text style={styles.productName}>{productName}</Text>
                  {' đang được phát triển và sẽ có mặt trong các phiên bản tiếp theo của Mauve Banking.'}
                </>
              ) : (
                'Tính năng này đang được phát triển và sẽ có mặt trong các phiên bản tiếp theo của Mauve Banking.'
              )}
            </Text>

            {/* Dismiss button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Đã hiểu"
            >
              <GlassView
                variant="dark"
                luminousBorder
                useBlur={false}
                borderRadius={Radius.lg}
                style={styles.dismissBtnInner}
              >
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(128, 108, 121, 0.35)', borderRadius: Radius.lg },
                  ]}
                />
                <Text style={styles.dismissBtnText}>Đã hiểu</Text>
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
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
    zIndex: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.30)',
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
  productName: {
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
  },
  dismissBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dismissBtnPressed: {
    opacity: 0.80,
    transform: [{ scale: 0.99 }],
  },
  dismissBtnInner: {
    width: '100%',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    letterSpacing: 0.2,
  },
});
