import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Plus,
  ArrowLeftRight,
  Wifi,
} from 'lucide-react-native';
import { Transaction } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
  onPress?: () => void;
}

type IconInfo = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
};

function getIconInfo(type: Transaction['type']): IconInfo {
  switch (type) {
    case 'transfer_in':
      return { icon: ArrowDownLeft, color: Palette.incomeGreen, bg: 'rgba(50, 215, 75, 0.12)' };
    case 'transfer_out':
      return { icon: ArrowUpRight, color: Palette.secondary, bg: 'rgba(193, 160, 172, 0.12)' };
    case 'interest':
      return { icon: TrendingUp, color: Palette.incomeGreen, bg: 'rgba(50, 215, 75, 0.12)' };
    case 'payment':
      return { icon: Receipt, color: Palette.gray400, bg: 'rgba(74, 63, 75, 0.45)' };
    case 'topup':
      return { icon: Plus, color: Palette.incomeGreen, bg: 'rgba(50, 215, 75, 0.12)' };
    case 'data_package':
      return { icon: Wifi, color: Palette.light, bg: 'rgba(193, 160, 172, 0.15)' };
    default:
      return { icon: ArrowLeftRight, color: Palette.gray400, bg: 'rgba(74, 63, 75, 0.45)' };
  }
}

/**
 * Refined Moonscape Transaction Row.
 * Solid dark-purple surface for density. Lucide icons with strokeWidth 1.75.
 * Incoming = green amount. Outgoing = white/neutral (reduces alarm fatigue).
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  isLast = false,
  onPress,
}) => {
  const isPositive = transaction.amount > 0;
  const iconInfo = getIconInfo(transaction.type);
  const IconComponent = iconInfo.icon;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(193, 160, 172, 0.08)', borderless: false }}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.borderBottom,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${formatVND(transaction.amount)}`}
    >
      {/* Icon */}
      <View style={[styles.iconCapsule, { backgroundColor: iconInfo.bg }]}>
        <IconComponent size={18} color={iconInfo.color} strokeWidth={1.75} />
      </View>

      {/* Details */}
      <View style={styles.detail}>
        <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {transaction.timestamp}
        </Text>
      </View>

      {/* Amount */}
      <View style={styles.amountCol}>
        <Text
          style={[styles.amount, isPositive ? styles.amountPositive : styles.amountNeutral]}
          numberOfLines={1}
        >
          {isPositive ? `+${formatVND(transaction.amount)}` : formatVND(transaction.amount)}
        </Text>
        <Text style={styles.status}>Thành công</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Palette.surfaceL2,
    minHeight: 64,
  },
  rowPressed: {
    backgroundColor: Palette.surfaceL3,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 217, 228, 0.07)',
  },
  iconCapsule: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detail: {
    flex: 1,
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 2,
  },
  meta: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
  },
  amountCol: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  amount: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 2,
  },
  amountPositive: {
    color: Palette.incomeGreen,
  },
  amountNeutral: {
    color: Palette.gray100,
  },
  status: {
    fontSize: Typography.fontSize.caption2,
    color: Palette.gray500,
  },
});
