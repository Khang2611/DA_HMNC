import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Wallet, ChevronDown } from 'lucide-react-native';
import { Account } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber } from '../utils/formatters';
import { GlassView } from './GlassView';

export interface SourceAccountSelectorProps {
  account: Account;
  onPress?: () => void;
  canSwitch?: boolean;
}

/**
 * Compact Source Account Selector Card
 * Reusable horizontal GlassView card for payment & transfer flows.
 * Displays masked account number and formatted balance with switch chevron.
 */
export const SourceAccountSelector: React.FC<SourceAccountSelectorProps> = ({
  account,
  onPress,
  canSwitch = true,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!canSwitch || !onPress}
      style={({ pressed }) => [pressed && canSwitch && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Tài khoản nguồn: ${maskAccountNumber(account.accountNumber)}, Số dư: ${formatVND(account.balance)}`}
    >
      <GlassView
        variant="card"
        borderRadius={Radius.lg}
        luminousBorder
        style={styles.card}
>
        <View
          pointerEvents="none"
          style={styles.mauveTint}
        />
        <View style={styles.iconCircle}>
          <Wallet size={18} color={Palette.light} strokeWidth={1.75} />
        </View>

        <View style={styles.centerCol}>
          <Text style={styles.accountNumberText} numberOfLines={1}>
            TK nguồn: {maskAccountNumber(account.accountNumber)}
          </Text>
          <Text style={styles.balanceText} numberOfLines={1}>
            Số dư: {formatVND(account.balance)}
          </Text>
        </View>

        {canSwitch && (
          <View style={styles.chevronWrapper}>
            <ChevronDown size={20} color={Palette.secondary} strokeWidth={2} />
          </View>
        )}
      </GlassView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.82,
  },
  mauveTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(128, 108, 121, 0.2)',
    borderRadius: Radius.lg,
  },
  card: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(240, 217, 228, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  accountNumberText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.light,
  },
  chevronWrapper: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
