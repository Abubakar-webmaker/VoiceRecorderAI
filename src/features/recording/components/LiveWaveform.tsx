import React, { useMemo, useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import useTheme from '@hooks/useTheme';

const { width: W } = Dimensions.get('window');

interface LiveWaveformProps {
  amplitudes:        number[];  // 0-1 values
  isRecording:       boolean;
  isPaused:          boolean;
  width?:            number;
  height?:           number;
}

const BAR_WIDTH = 4;
const BAR_GAP   = 2.5;

interface AnimatedBarProps {
  amplitude: number;
  maxHeight: number;
  isActive:  boolean;
  index:     number;
  total:     number;
  colors:    ReturnType<typeof useTheme>['colors'];
}

const AnimatedBar = ({
  amplitude,
  maxHeight,
  isActive,
  index,
  total,
  colors,
}: AnimatedBarProps): React.JSX.Element => {
  const minHeight = 4;
  const height    = minHeight + amplitude * (maxHeight - minHeight);

  // Last bar (current) animates with spring
  const barHeight = useSharedValue(minHeight);

  useEffect(() => {
    barHeight.value = withSpring(height, {
      damping:   8,
      stiffness: 200,
      mass:      0.5,
    });
  }, [height, barHeight]);

  const animStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  // Color: active bars = primary, current bar = recording
  const isCurrentBar = index === total - 1 && isActive;
  const barColor     = isCurrentBar
    ? colors.recording.default
    : isActive
    ? colors.primary.default
    : `${colors.primary.default}30`;

  return (
    <Animated.View
      style={[
        {
          width:           BAR_WIDTH,
          borderRadius:    BAR_WIDTH / 2,
          backgroundColor: barColor,
          marginRight:     BAR_GAP,
        },
        animStyle,
      ]}
    />
  );
};

const LiveWaveform = ({
  amplitudes,
  isRecording,
  isPaused,
  width  = W - 40,
  height = 80,
}: LiveWaveformProps): React.JSX.Element => {
  const { colors } = useTheme();

  const barCount = Math.floor(width / (BAR_WIDTH + BAR_GAP));

  // Fit amplitudes into bar count (right-aligned — latest on right)
  const bars = useMemo((): number[] => {
    const minHeight = 0.08;

    if (amplitudes.length === 0) {
      // Idle state — flat line with tiny noise
      return Array.from({ length: barCount }, (_, i) =>
        minHeight + Math.sin(i * 0.3) * 0.03,
      );
    }

    if (amplitudes.length >= barCount) {
      return amplitudes.slice(-barCount);
    }

    // Pad left with silence
    const padCount = barCount - amplitudes.length;
    return [
      ...Array<number>(padCount).fill(minHeight),
      ...amplitudes,
    ];
  }, [amplitudes, barCount]);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
        },
      ]}
    >
      {bars.map((amp, i) => (
        <AnimatedBar
          key={i}
          amplitude={amp}
          maxHeight={height}
          isActive={isRecording && !isPaused}
          index={i}
          total={bars.length}
          colors={colors}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems:     'flex-end',
    flexDirection:  'row',
    justifyContent: 'flex-start',
    overflow:       'hidden',
  },
});

export { LiveWaveform };