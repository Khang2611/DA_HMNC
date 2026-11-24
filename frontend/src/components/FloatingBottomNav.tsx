import React, { ComponentRef, RefObject } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Home, Package, ScanQrCode, Settings, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Typography, Spacing, Radius } from '../theme/tokens';
import { GlassView } from './GlassView';

export type TabKey = 'home' | 'products' | 'settings' | 'chatbot';

interface FloatingBottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onQrPress?: () => void;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
}

type Tab = {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const LEFT_TABS: Tab[] = [
  { key: 'home',     label: 'Trang chủ', icon: Home },
  { key: 'products', label: 'Sản phẩm',  icon: Package },
];

const RIGHT_TABS: Tab[] = [
  { key: 'settings', label: 'Cài đặt',   icon: Settings },
  { key: 'chatbot',  label: 'Chatbot',   icon: MessageCircle },
];

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onTabChange,
  onQrPress,
  blurTarget,
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Spacing.lg) + 8;

  // Spring animation for center QR button press
  const [qrScaleAnim] = React.useState(() => new Animated.Value(1));

  const handleQrPressIn = () => {
    Animated.spring(qrScaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handleQrPressOut = () => {
    Animated.spring(qrScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  };

  const renderTab = (tab: Tab) => {
    const isActive = activeTab === tab.key;
    const IconComponent = tab.icon;
    const activeColor = Palette.light;     // Mountain Heather #F0D9E4
    const inactiveColor = Palette.secondary; // Decanting #C1A0AC

    return (
      <Pressable
        key={tab.key}
        onPress={() => onTabChange(tab.key)}
        android_ripple={{ color: 'rgba(193, 160, 172, 0.12)', borderless: true, radius: 24 }}
        style={({ pressed }) => [
          styles.tabBtn,
          pressed && styles.tabBtnPressed,
        ]}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: isActive }}
      >
        <IconComponent
          size={21}
          color={isActive ? activeColor : inactiveColor}
          strokeWidth={isActive ? 2 : 1.75}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? activeColor : inactiveColor },
            isActive && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.outerContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      {/* Liquid Glass Navigation Bar (Frosted Blur with original dark smoky-mauve surface) */}
      <GlassView
        variant="dark"
        borderRadius={Radius.pill}
        blurTarget={blurTarget}
        tint="systemChromeMaterialDark"
        intensity={10}
        style={styles.navBar}
      >
        <View style={styles.navContent}>
          {/* Left tabs: Trang chủ, Sản phẩm */}
          <View style={styles.tabSideGroup}>
            {LEFT_TABS.map(renderTab)}
          </View>

          {/* Reserved center slot space for QR button alignment */}
          <View style={styles.centerSlot} pointerEvents="none" />

          {/* Right tabs: Cài đặt, Chatbot */}
          <View style={styles.tabSideGroup}>
            {RIGHT_TABS.map(renderTab)}
          </View>
        </View>
      </GlassView>

      {/* Raised Center QR Action Button (Raised ~10dp above bar, outside GlassView to avoid clipping) */}
      <View style={styles.qrAnchor} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ scale: qrScaleAnim }] }}>
          <Pressable
            onPress={onQrPress}
            onPressIn={handleQrPressIn}
            onPressOut={handleQrPressOut}
            android_ripple={{ color: 'rgba(240, 217, 228, 0.25)', borderless: true, radius: 28 }}
            style={styles.qrButton}
            accessibilityRole="button"
            accessibilityLabel="Quét mã QR"
          >
            <ScanQrCode size={24} color={Palette.light} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  navBar: {
    width: '100%',
    borderColor: 'rgba(193, 160, 172, 0.25)', // Original delicate border
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    width: '100%',
  },
  tabSideGroup: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerSlot: {
    width: 60, // Reserves space for center QR button
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    minWidth: 54,
  },
  tabBtnPressed: {
    opacity: 0.72,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 3,
    letterSpacing: Typography.letterSpacing.wide,
  },
  tabLabelActive: {
    fontWeight: Typography.fontWeight.semibold,
  },
  // Raised QR Button Anchor & Styling
  qrAnchor: {
    position: 'absolute',
    top: -12, // Raised ~12dp above the top of the nav bar
    alignSelf: 'center',
    zIndex: 10,
  },
  qrButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primary, // Moonscape #806C79
    borderColor: 'rgba(240, 217, 228, 0.40)', // Mountain Heather edge highlight
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 9,
  },
});
