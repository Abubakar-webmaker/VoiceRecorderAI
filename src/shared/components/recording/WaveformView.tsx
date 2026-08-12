import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import useTheme from '@hooks/useTheme';

interface WaveformViewProps {
  waveform:        number[];    // 0-1 amplitude values
  progress?:       number;      // 0-1 playback progress
  width:           number;
  height:          number;
  barWidth?:       number;
  barGap?:         number;
  activeColor?:    string;
  inactiveColor?:  string;
  onSeek?:         (progress: number) => void;
  style?:          ViewStyle;
}

const DEFAULT_WAVEFORM = Array.from(
  { length: 40 },
  (_, i) => 0.2 + Math.abs(Math.sin(i * 0.4)) * 0.6,
);

const WaveformView = ({
  waveform,
  progress     = 0,
  width,
  height,
  barWidth     = 3,
  barGap       = 2,
  activeColor,
  inactiveColor,
  style,
}: WaveformViewProps): React.JSX.Element => {
  const { colors } = useTheme();

  const active   = activeColor   ?? colors.primary.default;
  const inactive = inactiveColor ?? colors.border.default;

  // Normalize waveform to fit available bars
  const bars = useMemo(() => {
    const source = waveform.length > 0 ? waveform : DEFAULT_WAVEFORM;
    const barCount = Math.floor(width / (barWidth + barGap));

    if (source.length === barCount) return source;

    // Resample
    const resampled: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const ratio = i / barCount;
      const idx   = Math.floor(ratio * source.length);
      resampled.push(source[idx] ?? 0.3);
    }
    return resampled;
  }, [waveform, width, barWidth, barGap]);

  const minHeight = Math.max(3, height * 0.06);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
        },
        style,
      ]}
    >
      {bars.map((amp, i) => {
        const barHeight   = minHeight + amp * (height - minHeight);
        const isActive    = i / bars.length <= progress;

        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                width:           barWidth,
                height:          barHeight,
                marginRight:     barGap,
                borderRadius:    barWidth / 2,
                backgroundColor: isActive ? active : inactive,
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    // sizing and color dynamic
  },
  container: {
    alignItems:     'flex-end',
    flexDirection:  'row',
    justifyContent: 'flex-start',
    overflow:       'hidden',
  },
});

export { WaveformView };