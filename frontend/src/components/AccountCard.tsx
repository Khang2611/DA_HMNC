
import React, { useState, ComponentRef, RefObject } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Account } from '../types/banking';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { formatVND, maskAccountNumber } from '../utils/formatters';
import { GlassView } from './GlassView';
import { MorphIcon } from 'morphicons/react-native';
import { Eye, EyeOff } from 'lucide';

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  defaultHideBalance?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onPress,
  blurTarget,
  defaultHideBalance = true,
}) => {
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const isBalanceHidden = userToggled !== null ? userToggled : defaultHideBalance;

  const balanceText = isBalanceHidden
    ? '•••••• ₫'
    : formatVND(account.balance);

  const accountLabel =
    account.type === 'checking'
      ? 'Tài khoản thanh toán'
      : account.accountName;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: 'rgba(193, 160, 172, 0.12)',
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.touchable,
        pressed && styles.touchablePressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Tài khoản ${accountLabel}`}
    >
      <GlassView
        variant="card"
        borderRadius={Radius.xl}
        blurTarget={blurTarget}
        tint="systemChromeMaterialDark"
        intensity={10}
        style={styles.card}
      >
        {/* Thông tin tài khoản */}
        <View style={styles.header}>
          <Text style={styles.accountName} numberOfLines={1}>
            {accountLabel}
          </Text>

          <Text style={styles.accountNumber}>
            {maskAccountNumber(account.accountNumber)}
          </Text>
        </View>

        {/* Số dư */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>
            SỐ DƯ KHẢ DỤNG
          </Text>

          <View style={styles.balanceRow}>
            <Text
              style={styles.balanceAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {balanceText}
            </Text>

            <Pressable
              onPress={() => setUserToggled((v) => (v !== null ? !v : !defaultHideBalance))}
              hitSlop={12}
              style={styles.eyeBtn}
              accessibilityLabel={
                isBalanceHidden ? 'Hiện số dư' : 'Ẩn số dư'
              }
              accessibilityRole="button"
            >
              <MorphIcon
                icon={isBalanceHidden ? EyeOff : Eye}
                size={20}
                strokeWidth={1.75}
                color={Palette.secondary}
                spring="smooth"
                reducedMotion="user"
              />
            </Pressable>
          </View>
        </View>
      </GlassView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginVertical: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  touchablePressed: {
    opacity: 0.92,
  },
  card: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    position: 'relative',
  },
  header: {
    marginBottom: Spacing.xl,
  },
  accountName: {
    fontSize: Typography.fontSize.callout,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tight,
  },
  accountNumber: {
    fontSize: Typography.fontSize.caption1,
    color: Palette.secondary,
    marginTop: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
  },
  balanceSection: {
    marginBottom: 0,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
    color: Palette.secondary,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    flex: 1,
    fontSize: 30,
    fontWeight: Typography.fontWeight.semibold,
    color: Palette.white,
    letterSpacing: Typography.letterSpacing.tighter,
    lineHeight: 38,
  },
  eyeBtn: {
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 32,
    alignItems: 'flex-end',
  },
});
