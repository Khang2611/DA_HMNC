/**
 * ContactSupportView.tsx — Customer Care & Support Channels
 *
 * Direct communication channels: 24/7 Hotline, email, AI Chatbot integration,
 * and Premier Lounge locations.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  PhoneCall,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Copy,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { AppToast } from '../../components/AppToast';

interface ContactSupportViewProps {
  onOpenChatbot: () => void;
}

export const ContactSupportView: React.FC<ContactSupportViewProps> = ({ onOpenChatbot }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    setToastMsg(`Đã lưu ${label} vào bộ nhớ tạm: ${text}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <PhoneCall size={20} color={Palette.incomeGreen} strokeWidth={2} />
          <Text style={styles.introTitle}>Trung tâm Chăm sóc Khách hàng</Text>
        </View>
        <Text style={styles.introText}>
          Dành riêng cho khách hàng Mauve Premier. Đội ngũ chuyên viên tư vấn tài chính cao cấp luôn đồng hành cùng bạn 24/7.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>KÊNH HỖ TRỢ TRỰC TUYẾN</Text>
      </View>

      <View style={styles.cardGroup}>
        {/* Chatbot AI Assistant */}
        <Pressable
          onPress={onOpenChatbot}
          android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
          style={({ pressed }) => [styles.channelRow, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Trò chuyện với Mauve AI Assistant"
        >
          <View style={[styles.iconWrap, styles.aiIconWrap]}>
            <MessageCircle size={20} color={Palette.light} strokeWidth={2} />
          </View>
          <View style={styles.channelMeta}>
            <View style={styles.channelTitleRow}>
              <Text style={styles.channelTitle}>Trò chuyện với Mauve AI</Text>
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>Phản hồi tức thì</Text>
              </View>
            </View>
            <Text style={styles.channelSubtitle}>
              Hỏi đáp thông tin tài khoản, tra cứu giao dịch và hướng dẫn thao tác
            </Text>
          </View>
          <ChevronRight size={18} color={Palette.secondary} strokeWidth={1.75} />
        </Pressable>

        {/* 24/7 Hotline */}
        <View style={styles.channelRow}>
          <View style={styles.iconWrap}>
            <PhoneCall size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.channelMeta}>
            <Text style={styles.channelTitle}>Hotline VIP 24/7</Text>
            <Text style={styles.channelValue}>1900 8829 (Nhánh 1)</Text>
            <Text style={styles.channelSubtitle}>Miễn phí cước gọi từ mọi mạng viễn thông</Text>
          </View>
          <Pressable
            onPress={() => copyToClipboard('19008829', 'phone', 'số hotline')}
            style={styles.copyBtn}
            accessibilityLabel="Sao chép số hotline"
          >
            {copiedKey === 'phone' ? (
              <Check size={16} color={Palette.incomeGreen} strokeWidth={2} />
            ) : (
              <Copy size={16} color={Palette.secondary} strokeWidth={1.75} />
            )}
          </Pressable>
        </View>

        {/* Email Support */}
        <View style={[styles.channelRow, { borderBottomWidth: 0 }]}>
          <View style={styles.iconWrap}>
            <Mail size={18} color={Palette.light} strokeWidth={1.75} />
          </View>
          <View style={styles.channelMeta}>
            <Text style={styles.channelTitle}>Email Chăm sóc Khách hàng</Text>
            <Text style={styles.channelValue}>cskh@mauvebank.vn</Text>
            <Text style={styles.channelSubtitle}>Thời gian phản hồi trong vòng 2 giờ</Text>
          </View>
          <Pressable
            onPress={() => copyToClipboard('cskh@mauvebank.vn', 'email', 'địa chỉ email')}
            style={styles.copyBtn}
            accessibilityLabel="Sao chép địa chỉ email"
          >
            {copiedKey === 'email' ? (
              <Check size={16} color={Palette.incomeGreen} strokeWidth={2} />
            ) : (
              <Copy size={16} color={Palette.secondary} strokeWidth={1.75} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TRUNG TÂM PHỤC VỤ TRỰC TIẾP</Text>
      </View>

      <GlassView variant="card" borderRadius={Radius.lg} style={styles.loungeCard}>
        <View style={styles.loungeRow}>
          <MapPin size={20} color={Palette.secondary} strokeWidth={1.75} style={styles.loungeIcon} />
          <View style={styles.loungeContent}>
            <Text style={styles.loungeTitle}>Mauve Premier Lounge</Text>
            <Text style={styles.loungeAddress}>
              Tầng 68, Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh
            </Text>

            <View style={styles.workingHoursRow}>
              <Clock size={13} color={Palette.gray400} strokeWidth={1.75} />
              <Text style={styles.workingHoursText}>
                Thứ Hai - Thứ Sáu: 08:30 - 17:30 • Thứ Bảy: 08:30 - 12:00
              </Text>
            </View>
          </View>
        </View>
      </GlassView>

      {/* ── Demo Notice ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Lưu ý: Các kênh hotline và email trên được thiết lập mô phỏng cho ứng dụng Mauve Banking phục vụ mục đích kiểm thử và phát triển giao diện.
          </Text>
        </View>
      </GlassView>

      <AppToast
        visible={!!toastMsg}
        message={toastMsg || ''}
        onDismiss={() => setToastMsg(null)}
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
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(240, 217, 228, 0.08)',
  },
  rowPressed: {
    backgroundColor: 'rgba(240, 217, 228, 0.05)',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  aiIconWrap: {
    backgroundColor: 'rgba(128, 108, 121, 0.3)',
  },
  channelMeta: {
    flex: 1,
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  channelTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
  },
  instantBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  instantBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.incomeGreen,
  },
  channelValue: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
    marginTop: 1,
  },
  channelSubtitle: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.gray400,
    marginTop: 2,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  loungeCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  loungeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  loungeIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  loungeContent: {
    flex: 1,
  },
  loungeTitle: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 4,
  },
  loungeAddress: {
    fontSize: Typography.fontSize.footnote,
    color: Palette.gray300,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  workingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workingHoursText: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.gray400,
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
