/**
 * CustomizeScreen — Tùy chỉnh tiện ích
 *
 * Lets users pick exactly 4 products for the Home Quick Actions grid,
 * and reorder them with move-left / move-right controls.
 *
 * Rules:
 *  - Selection requires exactly 4 unique products to enable Save.
 *  - Canceling discards changes (parent passes current saved IDs as initialIds).
 *  - Coming Soon products are selectable (they show ComingSoonModal on Home tap).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
} from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  PRODUCTS,
  PRODUCT_CATEGORIES,
  ProductId,
} from '../data/products';

export interface CustomizeScreenProps {
  initialIds: ProductId[];
  onSave: (ids: ProductId[]) => void;
  onCancel: () => void;
}

const REQUIRED_COUNT = 4;

export const CustomizeScreen: React.FC<CustomizeScreenProps> = ({
  initialIds,
  onSave,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.xl;

  // Draft selection — changes are discarded if user cancels
  const [selected, setSelected] = useState<ProductId[]>([...initialIds]);

  const selectedSet = new Set(selected);
  const canSave = selected.length === REQUIRED_COUNT;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleToggle = (id: ProductId) => {
    if (selectedSet.has(id)) {
      // Remove
      setSelected((prev) => prev.filter((s) => s !== id));
    } else {
      // Add only if fewer than 4 selected
      if (selected.length < REQUIRED_COUNT) {
        setSelected((prev) => [...prev, id]);
      }
    }
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveRight = (index: number) => {
    if (index === selected.length - 1) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleRemove = (id: ProductId) => {
    setSelected((prev) => prev.filter((s) => s !== id));
  };

  const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Standard Screen Header ── */}
      <ScreenHeader
        title="Tùy chỉnh tiện ích"
        onBack={onCancel}
        backLabel="Hủy, quay lại trang chủ"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section A: Selected Quick Actions ── */}
        <View style={styles.sectionHeader}>
          <Pencil size={14} color={Palette.secondary} strokeWidth={1.75} />
          <Text style={styles.sectionTitle}>Tiện ích đã chọn</Text>
          <View style={styles.counterPill}>
            <Text
              style={[
                styles.counterText,
                selected.length < REQUIRED_COUNT && styles.counterTextWarn,
              ]}
            >
              {selected.length}/{REQUIRED_COUNT}
            </Text>
          </View>
        </View>

        {selected.length < REQUIRED_COUNT && (
          <Text style={styles.warningText}>
            Vui lòng chọn đủ {REQUIRED_COUNT} tiện ích để lưu.
          </Text>
        )}

        {/* Selected items — ordered list with reorder controls */}
        <GlassView variant="card" borderRadius={Radius.xl} style={styles.selectedCard}>
          {selected.length === 0 ? (
            <View style={styles.emptySelected}>
              <Text style={styles.emptySelectedText}>
                Chưa có tiện ích nào được chọn. Chọn từ danh sách bên dưới.
              </Text>
            </View>
          ) : (
            selected.map((id, index) => {
              const product = productMap.get(id);
              if (!product) return null;
              const { Icon } = product;
              const isFirst = index === 0;
              const isLast = index === selected.length - 1;

              return (
                <View
                  key={id}
                  style={[
                    styles.selectedRow,
                    !isLast && styles.selectedRowBorder,
                  ]}
                >
                  {/* Position badge */}
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionBadgeText}>{index + 1}</Text>
                  </View>

                  {/* Icon */}
                  <View style={styles.selectedIconBox}>
                    <Icon size={18} color={Palette.light} strokeWidth={1.75} />
                  </View>

                  {/* Label */}
                  <Text style={styles.selectedLabel} numberOfLines={1}>
                    {product.label}
                  </Text>

                  {/* Reorder controls */}
                  <View style={styles.reorderControls}>
                    <Pressable
                      onPress={() => handleMoveLeft(index)}
                      disabled={isFirst}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.reorderBtn,
                        isFirst && styles.reorderBtnDisabled,
                        pressed && !isFirst && styles.btnPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Di chuyển ${product.label} sang trái`}
                      accessibilityState={{ disabled: isFirst }}
                    >
                      <ChevronLeft
                        size={16}
                        color={isFirst ? 'rgba(193, 160, 172, 0.30)' : Palette.secondary}
                        strokeWidth={2}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => handleMoveRight(index)}
                      disabled={isLast}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.reorderBtn,
                        isLast && styles.reorderBtnDisabled,
                        pressed && !isLast && styles.btnPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Di chuyển ${product.label} sang phải`}
                      accessibilityState={{ disabled: isLast }}
                    >
                      <ChevronRight
                        size={16}
                        color={isLast ? 'rgba(193, 160, 172, 0.30)' : Palette.secondary}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>

                  {/* Remove */}
                  <Pressable
                    onPress={() => handleRemove(id)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.removeBtn, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Xóa ${product.label}`}
                  >
                    <X size={14} color={Palette.secondary} strokeWidth={2} />
                  </Pressable>
                </View>
              );
            })
          )}
        </GlassView>

        {/* ── Section B: All Products ── */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionTitle}>Tất cả tiện ích</Text>
        </View>
        <Text style={styles.sectionHint}>
          Nhấn để thêm hoặc bỏ chọn. Tối đa {REQUIRED_COUNT} tiện ích.
        </Text>

        {PRODUCT_CATEGORIES.map((cat) => {
          const products = PRODUCTS.filter((p) => p.categoryId === cat.id);
          if (products.length === 0) return null;

          return (
            <View key={cat.id} style={styles.allCategorySection}>
              <Text style={styles.allCategoryTitle}>{cat.title}</Text>
              <View style={styles.allGrid}>
                {products.map((product) => {
                  const { Icon } = product;
                  const isSelected = selectedSet.has(product.id);
                  const isDisabled = !isSelected && selected.length >= REQUIRED_COUNT;

                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => handleToggle(product.id)}
                      disabled={isDisabled}
                      style={({ pressed }) => [
                        styles.allGridItem,
                        isSelected && styles.allGridItemSelected,
                        isDisabled && styles.allGridItemDisabled,
                        pressed && !isDisabled && styles.btnPressed,
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityLabel={product.label}
                      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <View style={styles.checkOverlay}>
                          <CheckCircle2
                            size={16}
                            color={Palette.incomeGreen}
                            strokeWidth={2.5}
                          />
                        </View>
                      )}

                      {/* Icon */}
                      <View
                        style={[
                          styles.allGridIconBox,
                          isSelected && styles.allGridIconBoxSelected,
                          isDisabled && styles.allGridIconBoxDisabled,
                        ]}
                      >
                        <Icon
                          size={22}
                          color={
                            isDisabled
                              ? 'rgba(193, 160, 172, 0.35)'
                              : isSelected
                              ? Palette.white
                              : Palette.light
                          }
                          strokeWidth={1.75}
                        />
                      </View>

                      {/* Label */}
                      <Text
                        style={[
                          styles.allGridLabel,
                          isDisabled && styles.allGridLabelDisabled,
                        ]}
                        numberOfLines={2}
                      >
                        {product.label}
                      </Text>

                      {/* Coming Soon micro-badge */}
                      {product.status === 'coming_soon' && (
                        <View style={styles.csMiniBadge}>
                          <Text style={styles.csMiniBadgeText}>Sắp</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* ── Save button (in ScrollView, not fixed) ── */}
        <View style={styles.saveWrapper}>
          <Pressable
            onPress={() => canSave && onSave(selected)}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && styles.btnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Lưu thay đổi"
            accessibilityState={{ disabled: !canSave }}
          >
            <GlassView
              variant="dark"
              luminousBorder
              useBlur={false}
              borderRadius={Radius.lg}
              style={[styles.saveBtnInner, !canSave && styles.saveBtnInnerDisabled]}
            >
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: canSave
                      ? 'rgba(128, 108, 121, 0.38)'
                      : 'rgba(48, 38, 56, 0.40)',
                    borderRadius: Radius.lg,
                  },
                ]}
              />
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                Lưu thay đổi
              </Text>
            </GlassView>
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Hủy"
          >
            <Text style={styles.cancelBtnText}>Hủy thay đổi</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },

  btnPressed: { opacity: 0.72 },

  // ── Scroll ────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // ── Section Headers ───────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    flex: 1,
  },
  sectionHint: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginBottom: Spacing.md,
  },
  counterPill: {
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(193, 160, 172, 0.25)',
  },
  counterText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.incomeGreen,
  },
  counterTextWarn: {
    color: Palette.warning,
  },
  warningText: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.warning,
    marginBottom: Spacing.sm,
  },

  // ── Selected Card ─────────────────────────────
  selectedCard: {
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  emptySelected: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptySelectedText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  selectedRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.09)',
  },
  positionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(128, 108, 121, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.bold,
    color: Palette.light,
  },
  selectedIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLabel: {
    flex: 1,
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  reorderControls: {
    flexDirection: 'row',
    gap: 2,
  },
  reorderBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(48, 38, 56, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderBtnDisabled: {
    backgroundColor: 'rgba(30, 24, 38, 0.30)',
    borderColor: 'rgba(193, 160, 172, 0.07)',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── All Products Grid ─────────────────────────
  allCategorySection: {
    marginBottom: Spacing.lg,
  },
  allCategoryTitle: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  allGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allGridItem: {
    width: '22%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(30, 24, 38, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.14)',
    position: 'relative',
  },
  allGridItemSelected: {
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    borderColor: 'rgba(240, 217, 228, 0.40)',
    borderWidth: 1.5,
  },
  allGridItemDisabled: {
    opacity: 0.40,
  },
  checkOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  allGridIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(44, 37, 56, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  allGridIconBoxSelected: {
    backgroundColor: 'rgba(128, 108, 121, 0.45)',
    borderColor: 'rgba(240, 217, 228, 0.35)',
  },
  allGridIconBoxDisabled: {
    backgroundColor: 'rgba(30, 24, 38, 0.40)',
    borderColor: 'rgba(193, 160, 172, 0.08)',
  },
  allGridLabel: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.gray300,
    textAlign: 'center',
    lineHeight: 16,
  },
  allGridLabelDisabled: {
    color: 'rgba(193, 160, 172, 0.40)',
  },
  csMiniBadge: {
    marginTop: 3,
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  csMiniBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },

  // ── Save / Cancel ─────────────────────────────
  saveWrapper: {
    marginTop: Spacing.xl,
  },
  saveBtn: {
    height: 52,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.60,
  },
  saveBtnInner: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnInnerDisabled: {},
  saveBtnText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.light,
    letterSpacing: 0.2,
  },
  saveBtnTextDisabled: {
    color: 'rgba(240, 217, 228, 0.40)',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: Spacing.md,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
});
