/**
 * ScreenHeader.tsx — Standard Mauve Banking Screen Header
 *
 * Provides a pixel-perfect, consistent header layout across screens:
 * - Vertical position immediately below the Android status bar
 * - Safe-area handling: safeTop = Platform.OS === 'android' ? Spacing.xs : insets.top
 * - Standard height: 52 + safeTop
 * - Left 44x44 back arrow (ArrowLeft size 22, color Palette.light, strokeWidth 1.75, hitSlop 12)
 * - Centered title (headline, semibold, white, tight letterSpacing)
 * - Right 44x44 placeholder or optional custom rightElement
 * - Subtle bottom divider: rgba(193, 160, 172, 0.08)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Palette, Typography, Spacing } from '../theme/tokens';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  backLabel = 'Quay lại',
  leftElement,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'android' ? Spacing.xs : insets.top;

  return (
    <View style={[styles.navBar, { paddingTop: safeTop, height: 52 + safeTop }]}>
      {leftElement ? (
        <View style={styles.navLeftSlot}>
          {leftElement}
        </View>
      ) : onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.navBackBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <ArrowLeft size={22} color={Palette.light} strokeWidth={1.75} />
        </Pressable>
      ) : (
        <View style={styles.navPlaceholder} />
      )}

      <View style={[styles.navTitleContainer, { top: safeTop }]} pointerEvents="none">
        <Text style={styles.navTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightElement ? (
        <View style={styles.navRightSlot}>
          {rightElement}
        </View>
      ) : (
        <View style={styles.navPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.08)',
    position: 'relative',
    zIndex: 10,
  },
  navBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  navTitleContainer: {
    position: 'absolute',
    left: 56,
    right: 56,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    textAlign: 'center',
  },
  navPlaceholder: {
    width: 44,
    height: 44,
  },
  navLeftSlot: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  navRightSlot: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  btnPressed: {
    opacity: 0.72,
  },
});
