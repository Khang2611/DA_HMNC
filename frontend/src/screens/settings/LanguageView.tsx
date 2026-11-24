/**
 * LanguageView.tsx — Language & Localization Preferences
 *
 * Language preference with Vietnamese default and future-ready English preview.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Globe, Check, Info } from 'lucide-react-native';

import { SettingsPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { FeedbackDialog } from '../../components/FeedbackDialog';

interface LanguageViewProps {
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
}

export const LanguageView: React.FC<LanguageViewProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [selectedLang, setSelectedLang] = useState<'vi' | 'en'>(preferences.language);
  const [showEnPreview, setShowEnPreview] = useState(false);

  const handleSelectLanguage = (lang: 'vi' | 'en') => {
    if (lang === 'en') {
      setShowEnPreview(true);
    }
    setSelectedLang(lang);
    onUpdatePreferences({
      ...preferences,
      language: lang,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <Globe size={20} color={Palette.light} strokeWidth={2} />
          <Text style={styles.introTitle}>Ngôn ngữ hiển thị</Text>
        </View>
        <Text style={styles.introText}>
          Chọn ngôn ngữ bạn muốn sử dụng trên toàn bộ ứng dụng Mauve Banking.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DANH SÁCH NGÔN NGỮ</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Vietnamese (Default) */}
        <Pressable
          onPress={() => handleSelectLanguage('vi')}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [
            styles.row,
            selectedLang === 'vi' && styles.rowSelected,
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedLang === 'vi' }}
          accessibilityLabel="Tiếng Việt (Mặc định)"
        >
          <View style={styles.flagIconWrap}>
            <Text style={styles.flagText}>🇻🇳</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.langName}>Tiếng Việt</Text>
            <Text style={styles.langSub}>Mặc định • Bản địa hóa đầy đủ</Text>
          </View>
          {selectedLang === 'vi' ? (
            <View style={styles.checkCircle}>
              <Check size={14} color={Palette.white} strokeWidth={2.5} />
            </View>
          ) : null}
        </Pressable>

        {/* English (Preview) */}
        <Pressable
          onPress={() => handleSelectLanguage('en')}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [
            styles.row,
            selectedLang === 'en' && styles.rowSelected,
            pressed && styles.rowPressed,
            { borderBottomWidth: 0 },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedLang === 'en' }}
          accessibilityLabel="English (Preview)"
        >
          <View style={styles.flagIconWrap}>
            <Text style={styles.flagText}>🇬🇧</Text>
          </View>
          <View style={styles.textWrap}>
            <View style={styles.previewTitleRow}>
              <Text style={styles.langName}>English</Text>
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>Demo Preview</Text>
              </View>
            </View>
            <Text style={styles.langSub}>Bản xem trước • Đang phát triển</Text>
          </View>
          {selectedLang === 'en' ? (
            <View style={styles.checkCircle}>
              <Check size={14} color={Palette.white} strokeWidth={2.5} />
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* ── Notice: Localization Roadmap ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Mauve Banking hiện tối ưu hóa trải nghiệm bằng Tiếng Việt. Bản dịch Tiếng Anh đa ngôn ngữ đang trong lộ trình phát triển và hoàn thiện.
          </Text>
        </View>
      </GlassView>

      <FeedbackDialog
        visible={showEnPreview}
        variant="info"
        title="English Language Preview"
        message="Mauve Banking is currently optimized in Vietnamese. The complete English interface is under active development. English preview preference is now saved."
        buttonLabel="OK"
        onClose={() => setShowEnPreview(false)}
      />
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
  introCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  introText: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 18,
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
  cardGroup: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(240, 217, 228, 0.08)',
  },
  rowSelected: {
    backgroundColor: 'rgba(30, 24, 38, 0.8)',
  },
  rowPressed: {
    backgroundColor: 'rgba(240, 217, 228, 0.05)',
  },
  flagIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  flagText: {
    fontSize: 20,
  },
  textWrap: {
    flex: 1,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  previewBadge: {
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
  },
  langSub: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeCard: {
    backgroundColor: 'rgba(30, 24, 38, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(193, 160, 172, 0.15)',
    padding: Spacing.md,
  },
  noticeInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray300,
    lineHeight: 17,
  },
});
