/**
 * QuickActionsGrid — Dynamic 4-slot home quick actions.
 *
 * Renders exactly 4 products from the shared PRODUCTS registry.
 * Accepts `actionIds` from parent state (supports persistence).
 * Includes a subtle "Tùy chỉnh" affordance next to the section heading.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';
import { PRODUCT_MAP, ProductId } from '../data/products';

interface QuickActionsGridProps {
  /** Exactly 4 product IDs to display. */
  actionIds: ProductId[];
  onSelectAction?: (id: ProductId) => void;
  onCustomize?: () => void;
}

/**
 * Refined Moonscape Quick Actions.
 * Consistent Lucide iconography, size 22dp, stroke width 1.75, Moonscape palette.
 */
export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  actionIds,
  onSelectAction,
  onCustomize,
}) => {
  return (
    <View>
      {/* Section heading with Tùy chỉnh control */}
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Tiện ích nhanh</Text>
        {onCustomize && (
          <Pressable
            onPress={onCustomize}
            hitSlop={8}
            style={({ pressed }) => [styles.customizeBtn, pressed && styles.customizeBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Tùy chỉnh tiện ích nhanh"
          >
            <Text style={styles.customizeBtnText}>Tùy chỉnh</Text>
          </Pressable>
        )}
      </View>

      {/* Grid row — always exactly 4 items */}
      <View style={styles.container}>
        {actionIds.map((id) => {
          const product = PRODUCT_MAP.get(id);
          if (!product) return null;
          const { Icon } = product;
          return (
            <Pressable
              key={id}
              onPress={() => onSelectAction?.(id)}
              android_ripple={{ color: 'rgba(193, 160, 172, 0.15)', borderless: true }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              accessibilityRole="button"
              accessibilityLabel={product.label}
            >
              <GlassView variant="card" borderRadius={Radius.lg} style={styles.iconBox}>
                <Icon size={22} color={Palette.light} strokeWidth={1.75} />
              </GlassView>
              <Text style={styles.label} numberOfLines={2}>
                {product.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headingTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
  },
  customizeBtnPressed: { opacity: 0.72 },
  customizeBtnText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },

  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  itemPressed: {
    opacity: 0.78,
  },
  iconBox: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 37, 56, 0.70)',
    borderColor: 'rgba(193, 160, 172, 0.16)',
    borderWidth: 1,
  },
  label: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.gray300,
    textAlign: 'center',
    lineHeight: 15,
  },
});
