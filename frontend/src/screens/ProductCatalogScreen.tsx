/**
 * ProductCatalogScreen — Sản phẩm & Dịch vụ
 *
 * Full 10-product catalog grouped by category.
 * Uses shared PRODUCTS registry. Available products navigate; Coming Soon shows modal.
 * Supports inline real-time filtering with Vietnamese diacritic-insensitive search.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Search, X } from 'lucide-react-native';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from '../components/GlassView';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  PRODUCTS,
  PRODUCT_CATEGORIES,
  Product,
  ProductId,
} from '../data/products';
import { removeVietnameseDiacritics } from '../utils/transactionHistory';

export interface ProductCatalogScreenProps {
  visible?: boolean;
  onClose: () => void;
  onNavigate: (id: ProductId) => void;
}

export const ProductCatalogScreen: React.FC<ProductCatalogScreenProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.xl) + Spacing.xl;

  const [comingSoonProduct, setComingSoonProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [prevVisible, setPrevVisible] = useState(visible);

  // Reset search query whenever screen is reopened (even if kept mounted)
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible && searchQuery !== '') {
      setSearchQuery('');
    }
  }

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleProductPress = (product: Product) => {
    if (product.status === 'available') {
      setSearchQuery('');
      onNavigate(product.id);
    } else {
      setComingSoonProduct(product);
    }
  };

  // Derive filtered categories in place
  const filteredCategories = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return PRODUCT_CATEGORIES.map((cat) => ({
        ...cat,
        products: PRODUCTS.filter((p) => p.categoryId === cat.id),
      })).filter((cat) => cat.products.length > 0);
    }

    const normQuery = removeVietnameseDiacritics(trimmed);

    return PRODUCT_CATEGORIES.map((cat) => {
      const matchingProducts = PRODUCTS.filter((p) => {
        if (p.categoryId !== cat.id) return false;
        const normLabel = removeVietnameseDiacritics(p.label);
        return normLabel.includes(normQuery);
      });
      return {
        ...cat,
        products: matchingProducts,
      };
    }).filter((cat) => cat.products.length > 0);
  }, [searchQuery]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Navigation bar */}
      <ScreenHeader
        title="Sản phẩm & Dịch vụ"
        onBack={handleClose}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Search bar replacing the old introductory paragraph */}
        <View style={styles.searchBarWrapper}>
          <Search size={18} color={Palette.secondary} strokeWidth={1.75} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Nhập từ khóa tìm kiếm"
            placeholderTextColor={Palette.gray500}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.searchClearBtn}
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm"
            >
              <X size={16} color={Palette.light} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Empty state when no products match */}
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Không tìm thấy dịch vụ phù hợp</Text>
            <Text style={styles.emptySubtitle}>Thử tìm kiếm bằng từ khóa khác.</Text>
          </View>
        ) : (
          /* Filtered product groups in place */
          filteredCategories.map((cat) => (
            <View key={cat.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{cat.title}</Text>

              <GlassView variant="card" borderRadius={Radius.xl} style={styles.categoryCard}>
                {cat.products.map((product, index) => {
                  const { Icon } = product;
                  const isLast = index === cat.products.length - 1;
                  const isComingSoon = product.status === 'coming_soon';

                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => handleProductPress(product)}
                      style={({ pressed }) => [
                        styles.productRow,
                        !isLast && styles.productRowBorder,
                        pressed && styles.productRowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isComingSoon
                          ? `${product.label} — Sắp ra mắt`
                          : product.label
                      }
                      accessibilityState={{ disabled: false }}
                    >
                      {/* Icon box */}
                      <View
                        style={[
                          styles.productIconBox,
                          isComingSoon && styles.productIconBoxMuted,
                        ]}
                      >
                        <Icon
                          size={20}
                          color={isComingSoon ? Palette.secondary : Palette.light}
                          strokeWidth={1.75}
                        />
                      </View>

                      {/* Label + badge */}
                      <View style={styles.productMeta}>
                        <Text
                          style={[
                            styles.productLabel,
                            isComingSoon && styles.productLabelMuted,
                          ]}
                          numberOfLines={1}
                        >
                          {product.label}
                        </Text>
                        {isComingSoon && (
                          <View style={styles.comingSoonBadge}>
                            <Text style={styles.comingSoonBadgeText}>Sắp ra mắt</Text>
                          </View>
                        )}
                      </View>

                      {/* Chevron */}
                      <ChevronRight
                        size={16}
                        color={isComingSoon ? 'rgba(193, 160, 172, 0.35)' : Palette.secondary}
                        strokeWidth={2}
                      />
                    </Pressable>
                  );
                })}
              </GlassView>
            </View>
          ))
        )}
      </ScrollView>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={comingSoonProduct !== null}
        productName={comingSoonProduct?.label}
        onClose={() => setComingSoonProduct(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },

  // ── Scroll ────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // ── Search Bar ────────────────────────────────
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceL2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.subheadline,
    color: Palette.white,
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: Spacing.xs,
  },

// ── Empty State ───────────────────────────────
emptyContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: Spacing.lg,
  paddingVertical: Spacing.xxxl,
  minHeight: 400,
},
emptyTitle: {
  fontSize: Typography.fontSize.headline,
  fontWeight: Typography.fontWeight.semibold,
  color: Palette.white,
  textAlign: 'center',
  marginBottom: Spacing.xs,
},
emptySubtitle: {
  fontSize: Typography.fontSize.footnote,
  color: Palette.secondary,
  textAlign: 'center',
},
  // ── Category Section ──────────────────────────
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  categoryCard: {
    overflow: 'hidden',
  },

  // ── Product Row ───────────────────────────────
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(193, 160, 172, 0.09)',
  },
  productRowPressed: {
    backgroundColor: 'rgba(193, 160, 172, 0.06)',
  },
  productIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(128, 108, 121, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIconBoxMuted: {
    backgroundColor: 'rgba(48, 38, 56, 0.50)',
    borderColor: 'rgba(193, 160, 172, 0.12)',
  },
  productMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  productLabel: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
  },
  productLabelMuted: {
    color: Palette.secondary,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(128, 108, 121, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(193, 160, 172, 0.22)',
  },
  comingSoonBadgeText: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
});
