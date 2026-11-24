/**
 * HelpCenterView.tsx — Help Center & FAQ Accordion
 *
 * Categorized, searchable banking FAQs with expandable answers and
 * direct links to customer care.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PhoneCall,
  X,
  CreditCard,
  Send,
  FileText,
  ScanQrCode,
  PiggyBank,
  ShieldCheck,
} from 'lucide-react-native';

import { FAQCategory } from '../../types/settings';
import { MOCK_FAQS } from '../../data/mockUser';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';

interface HelpCenterViewProps {
  onNavigateContact: () => void;
}

const CATEGORIES: { key: FAQCategory; label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }[] = [
  { key: 'all', label: 'Tất cả', icon: HelpCircle },
  { key: 'transfer', label: 'Chuyển tiền', icon: Send },
  { key: 'cards', label: 'Thẻ & Hạn mức', icon: CreditCard },
  { key: 'bills', label: 'Hóa đơn', icon: FileText },
  { key: 'qr', label: 'VietQR', icon: ScanQrCode },
  { key: 'savings', label: 'Tiết kiệm', icon: PiggyBank },
  { key: 'security', label: 'Bảo mật', icon: ShieldCheck },
];

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onNavigateContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq_01');

  const filteredFaqs = useMemo(() => {
    return MOCK_FAQS.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQ = item.question.toLowerCase().includes(query);
        const matchesA = item.answer.toLowerCase().includes(query);
        return matchesQ || matchesA;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <Search size={18} color={Palette.gray400} strokeWidth={1.75} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập từ khóa tìm kiếm"
          placeholderTextColor={Palette.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Tìm kiếm câu hỏi trợ giúp"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <X size={16} color={Palette.gray400} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Category Pills (Horizontal Scroll) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsContainer}
        style={styles.categoryScrollView}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.key;
          const IconComp = cat.icon;

          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              style={({ pressed }) => [
                styles.categoryPill,
                isSelected && styles.categoryPillSelected,
                pressed && styles.pillPressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <IconComp
                size={14}
                color={isSelected ? Palette.white : Palette.gray400}
                strokeWidth={1.75}
              />
              <Text
                style={[
                  styles.categoryPillText,
                  isSelected && styles.categoryPillTextSelected,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── FAQs Accordion ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          CÂU HỎI PHỔ BIẾN ({filteredFaqs.length})
        </Text>
      </View>

      {filteredFaqs.length === 0 ? (
        <View style={styles.emptyState}>
          <HelpCircle size={32} color={Palette.gray500} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Không tìm thấy câu hỏi phù hợp</Text>
          <Text style={styles.emptySub}>
            Thử tìm kiếm với từ khóa khác hoặc liên hệ bộ phận hỗ trợ khách hàng.
          </Text>
        </View>
      ) : (
        <View style={styles.faqList}>
          {filteredFaqs.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <View key={item.id} style={styles.faqCard}>
                <Pressable
                  onPress={() => toggleExpand(item.id)}
                  android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
                  style={styles.faqHeader}
                  accessibilityRole="button"
                  accessibilityLabel={item.question}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color={Palette.secondary} strokeWidth={1.75} />
                  ) : (
                    <ChevronDown size={18} color={Palette.gray500} strokeWidth={1.75} />
                  )}
                </Pressable>

                {isExpanded ? (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Need More Help Banner ── */}
      <GlassView variant="card" borderRadius={Radius.lg} style={styles.contactBanner}>
        <View style={styles.contactBannerInner}>
          <View style={styles.contactIconWrap}>
            <PhoneCall size={22} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.contactTextWrap}>
            <Text style={styles.contactTitle}>Vẫn cần hỗ trợ thêm?</Text>
            <Text style={styles.contactSub}>
              Đội ngũ chăm sóc khách hàng Mauve Premier luôn sẵn sàng 24/7.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onNavigateContact}
          style={({ pressed }) => [styles.contactBtn, pressed && styles.pillPressed]}
          accessibilityRole="button"
          accessibilityLabel="Liên hệ hỗ trợ"
        >
          <Text style={styles.contactBtnText}>Liên hệ hỗ trợ ngay</Text>
        </Pressable>
      </GlassView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.12)',
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Palette.white,
    fontSize: Typography.fontSize.subheadline,
  },
  clearBtn: {
    padding: 4,
  },
  categoryScrollView: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.xl,
  },
  categoryPillsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(240, 217, 228, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
  },
  categoryPillSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.secondary,
  },
  pillPressed: {
    opacity: 0.7,
  },
  categoryPillText: {
    fontSize: Typography.fontSize.caption1,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.gray300,
  },
  categoryPillTextSelected: {
    color: Palette.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.caption2,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.secondary,
    letterSpacing: 0.8,
  },
  faqList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  faqCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  faqQuestion: {
    flex: 1,
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
    marginRight: Spacing.md,
    lineHeight: 20,
  },
  faqBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(240, 217, 228, 0.06)',
    paddingTop: 10,
  },
  faqAnswer: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    textAlign: 'center',
    maxWidth: 260,
  },
  contactBanner: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.2)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  contactBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  contactIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(128, 108, 121, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactTextWrap: {
    flex: 1,
  },
  contactTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 2,
  },
  contactSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    lineHeight: 16,
  },
  contactBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
});
