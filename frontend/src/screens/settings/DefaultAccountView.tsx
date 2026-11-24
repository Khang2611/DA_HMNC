/**
 * DefaultAccountView.tsx — Select Default Payment Account
 *
 * Allows user to pick which checking/payment account serves as the default
 * source across transfer, top-up, and bill payment flows.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Check, CreditCard, Info } from 'lucide-react-native';

import { Account } from '../../types/banking';
import { SettingsPreferences } from '../../types/settings';
import { Palette, Typography, Spacing, Radius } from '../../theme/tokens';
import { GlassView } from '../../components/GlassView';
import { formatVND, maskAccountNumber } from '../../utils/formatters';

interface DefaultAccountViewProps {
  accounts: Account[];
  preferences: SettingsPreferences;
  onUpdatePreferences: (updated: SettingsPreferences) => void;
}

export const DefaultAccountView: React.FC<DefaultAccountViewProps> = ({
  accounts,
  preferences,
  onUpdatePreferences,
}) => {
  // Filter for checking / payment accounts, fallback to all accounts if none
  const paymentAccounts = accounts.filter(
    (acc) => acc.type === 'checking' || acc.type === 'savings'
  );

  const handleSelectAccount = (accountId: string) => {
    onUpdatePreferences({
      ...preferences,
      defaultAccountId: accountId,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Tài khoản nguồn ưu tiên</Text>
        <Text style={styles.introDescription}>
          Tài khoản được chọn sẽ tự động được đặt làm nguồn trích tiền mặc định khi bạn thực hiện Chuyển tiền, Nạp tiền điện thoại, Nạp ví và Thanh toán hóa đơn.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DANH SÁCH TÀI KHOẢN KHẢ DỤNG</Text>
      </View>

      <View style={styles.accountsList}>
        {paymentAccounts.map((account) => {
          const isSelected = account.id === preferences.defaultAccountId;

          return (
            <Pressable
              key={account.id}
              onPress={() => handleSelectAccount(account.id)}
              android_ripple={{ color: 'rgba(193, 160, 172, 0.12)' }}
              style={({ pressed }) => [
                styles.accountCard,
                isSelected && styles.accountCardSelected,
                pressed && styles.accountCardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${account.accountName}, Số dư: ${formatVND(account.balance)}`}
            >
              <View style={styles.accountCardInner}>
                <View style={styles.accountTopRow}>
                  <View style={styles.accountIconWrap}>
                    <CreditCard
                      size={20}
                      color={isSelected ? Palette.light : Palette.gray400}
                      strokeWidth={1.75}
                    />
                  </View>

                  <View style={styles.accountMeta}>
                    <Text style={styles.accountName} numberOfLines={1}>
                      {account.accountName}
                    </Text>
                    <Text style={styles.accountNumber}>
                      {maskAccountNumber(account.accountNumber)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected ? (
                      <Check size={14} color={Palette.white} strokeWidth={2.5} />
                    ) : null}
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Số dư khả dụng:</Text>
                  <Text style={styles.balanceValue}>{formatVND(account.balance)}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── Guidance Note ── */}
      <GlassView variant="card" borderRadius={Radius.md} style={styles.noticeCard}>
        <View style={styles.noticeInner}>
          <Info size={16} color={Palette.secondary} strokeWidth={1.75} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Bạn luôn có thể linh hoạt chuyển đổi giữa các tài khoản thanh toán khác nhau ngay tại màn hình xác nhận giao dịch.
          </Text>
        </View>
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
  introCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 4,
  },
  introDescription: {
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
  accountsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  accountCard: {
    backgroundColor: Palette.surfaceL1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 217, 228, 0.08)',
    overflow: 'hidden',
  },
  accountCardSelected: {
    borderColor: Palette.secondary,
    backgroundColor: 'rgba(30, 24, 38, 0.85)',
  },
  accountCardPressed: {
    opacity: 0.85,
  },
  accountCardInner: {
    padding: Spacing.lg,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(240, 217, 228, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accountMeta: {
    flex: 1,
  },
  accountName: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
    letterSpacing: 0.5,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Palette.gray500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(240, 217, 228, 0.08)',
    marginVertical: Spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.gray400,
  },
  balanceValue: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
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
