import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import useTheme from '@hooks/useTheme';
import { Typography } from '@components/common/Typography';

interface LoaderProps {
  size?:    'sm' | 'md' | 'lg';
  color?:   string;
  label?:   string;
  fullScreen?: boolean;
  variant?: 'dots' | 'pulse' | 'ai';
}

// ─── AI-style pulsing dots loader ────────────────────────────────
const AIDots = ({ color, size }: { color: string; size: number }): React.JSX.Element => {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const config = { duration: 500, easing: Easing.inOut(Easing.ease) };

    dot1.value = withRepeat(withTiming(1, config), -1, true);
    dot2.value = withDelay(160, withRepeat(withTiming(1, config), -1, true));
    dot3.value = withDelay(320, withRepeat(withTiming(1, config), -1, true));
  }, [dot1, dot2, dot3]);

  const dotStyle1 = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: dot1.value }] }));
  const dotStyle2 = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: dot2.value }] }));
  const dotStyle3 = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: dot3.value }] }));

  const dotSize = size * 0.2;

  return (
    <View style={styles.dotsContainer}>
      {[dotStyle1, dotStyle2, dotStyle3].map((aStyle, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width:        dotSize,
              height:       dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              marginHorizontal: dotSize * 0.4,
            },
            aStyle,
          ]}
        />
      ))}
    </View>
  );
};

// ─── Pulsing ring loader ──────────────────────────────────────────
const PulseRing = ({ color, size }: { color: string; size: number }): React.JSX.Element => {
  const ring1Scale   = useSharedValue(0.6);
  const ring1Opacity = useSharedValue(1);
  const ring2Scale   = useSharedValue(0.6);
  const ring2Opacity = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.out(Easing.quad);
    ring1Scale.value   = withRepeat(withTiming(1, { duration: 1200, easing }), -1, false);
    ring1Opacity.value = withRepeat(withTiming(0, { duration: 1200, easing }), -1, false);
    ring2Scale.value   = withDelay(600, withRepeat(withTiming(1, { duration: 1200, easing }), -1, false));
    ring2Opacity.value = withDelay(600, withRepeat(withTiming(0, { duration: 1200, easing }), -1, false));
  }, [ring1Opacity, ring1Scale, ring2Opacity, ring2Scale]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity:   ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity:   ring2Opacity.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[
        ring1Style,
        ring2Style,
      ].map((aStyle, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position:     'absolute',
              width:        size,
              height:       size,
              borderRadius: size / 2,
              borderWidth:  2,
              borderColor:  color,
            },
            aStyle,
          ]}
        />
      ))}
      <View
        style={{
          width:           size * 0.35,
          height:          size * 0.35,
          borderRadius:    size * 0.35 / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

// ─── Main Loader Component ────────────────────────────────────────
const Loader = ({
  size     = 'md',
  color,
  label,
  fullScreen = false,
  variant  = 'ai',
}: LoaderProps): React.JSX.Element => {
  const { colors, spacing } = useTheme();

  const loaderColor = color ?? colors.primary.default;

  const sizePx = { sm: 32, md: 48, lg: 64 }[size];

  const content = (
    <View style={[styles.content, { gap: spacing[3] }]}>
      {variant === 'ai' || variant === 'dots' ? (
        <AIDots color={loaderColor} size={sizePx} />
      ) : (
        <PulseRing color={loaderColor} size={sizePx} />
      )}
      {label != null && (
        <Typography variant="bodySm" color="secondary" align="center">
          {label}
        </Typography>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.bg.primary }]}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  content: {
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  dotsContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
});

export { Loader };