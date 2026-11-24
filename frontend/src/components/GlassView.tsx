import React, { ComponentRef, RefObject, useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { GlassEffect, Radius } from '../theme/tokens';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'dark' | 'light' | 'card' | 'subtle';
  borderRadius?: number;
  useBlur?: boolean;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  tint?: BlurTint;
  intensity?: number;
  luminousBorder?: boolean;
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  variant = 'dark',
  borderRadius = Radius.lg,
  useBlur = true,
  blurTarget,
  tint = 'systemChromeMaterialDark',
  intensity,
  luminousBorder = false,
}) => {
  const config = GlassEffect[variant];
  const activeIntensity = intensity ?? config.blurIntensity;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const showEdge = variant === 'card' || luminousBorder;

  const edgeInset = 0.5;

  const edgeRadius = Math.max(
    0,
    Math.min(
      borderRadius,
      dimensions.width / 2,
      dimensions.height / 2
    ) - edgeInset
  );

  const onCardLayout = (event: LayoutChangeEvent) => {
    if (!showEdge) return;
    const { width, height } = event.nativeEvent.layout;
    setDimensions(previous =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height }
    );
  };

  // SVG sits inside the View's border box. Inset prevents clipping on Android.
  // A single hairline border with a faint gradient highlight; no inner edge or glow.

const edgeHighlight =
  showEdge && dimensions.width > 8 && dimensions.height > 8 ? (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={dimensions.width} height={dimensions.height}>
        <Defs>
          <LinearGradient
            id="glassEdgeHighlight"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#F0D9E4" stopOpacity={0.25} />
            <Stop offset="45%" stopColor="#E0BFCE" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#F0D9E4" stopOpacity={0.25} />
          </LinearGradient>
        </Defs>

        {/* Lớp viền nền */}
        <Rect
          x={edgeInset}
          y={edgeInset}
          width={dimensions.width - edgeInset * 2}
          height={dimensions.height - edgeInset * 2}
          rx={edgeRadius}
          ry={edgeRadius}
          fill="none"
          stroke="#E0BFCE"
          strokeOpacity={0.16}
          strokeWidth={0.5}
        />

        {/* Lớp viền bắt sáng, chồng khít lên lớp nền */}
        <Rect
          x={edgeInset}
          y={edgeInset}
          width={dimensions.width - edgeInset * 2}
          height={dimensions.height - edgeInset * 2}
          rx={edgeRadius}
          ry={edgeRadius}
          fill="none"
          stroke="url(#glassEdgeHighlight)"
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  ) : null;


  const containerStyle = [
    styles.container,
    {
      borderRadius,
      borderColor: showEdge ? 'transparent' : config.borderColor,
      borderWidth: showEdge ? 0 : config.borderWidth,
    },
    style,
  ];

  if (useBlur) {
    return (
      <View onLayout={onCardLayout} style={containerStyle}>
        <BlurView
          intensity={activeIntensity}
          tint={tint}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: config.blurOverlayColor, borderRadius },
          ]}
        />
        {children}
        {edgeHighlight}
      </View>
    );
  }

  return (
    <View
      onLayout={onCardLayout}
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: showEdge ? 'transparent' : config.borderColor,
          borderWidth: showEdge ? 0 : config.borderWidth,
          borderRadius,
        },
        style,
      ]}
    >
      {children}
      {edgeHighlight}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
