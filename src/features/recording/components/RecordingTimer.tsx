import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import useTheme       from '@hooks/useTheme';
import { MonoText, Caption } from '@components/common/Typography';

interface RecordingTimerProps {
  duration:    number;  // seconds
  isRecording: boolean;
  isPaused:    boolean;
}

const formatTimer = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const RecordingTimer = ({
  duration,
  isRecording,
  isPaused,
}: RecordingTimerProps): React.JSX.Element => {
  const { colors } = useTheme();

  // Blinking dot when recording
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    if (isRecording && !isPaused) {
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 500 }),
          withTiming(1,   { duration: 500 }),
        ),
        -1, false,
      );
    } else {
      dotOpacity.value = isPaused ? 0.5 : 1;
    }
  }, [isRecording, isPaused, dotOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusRow}>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: isPaused
                ? colors.warning.default
                : isRecording
                ? colors.recording.default
                : colors.border.default,
            },
            dotStyle,
          ]}
        />
        <Caption
          style={[
            styles.statusText,
            {
              color: isPaused
                ? colors.warning.default
                : isRecording
                ? colors.recording.default
                : colors.text.tertiary,
            }
          ]}
        >
          {isPaused ? 'Paused' : isRecording ? 'Recording' : 'Ready'}
        </Caption>
      </View>

      {/* Timer */}
      <MonoText
        style={[
          styles.timer,
          { color: colors.text.primary }
        ]}
      >
        <MonoText>{formatTimer(Math.floor(duration))}</MonoText>
      </MonoText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap:        8,
  } as ViewStyle,
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  } as ViewStyle,
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  } as ViewStyle,
  statusText: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timer: {
    fontSize:      48,
    fontWeight:    '700',
    letterSpacing: -1,
    lineHeight:    56,
  },
});

export { RecordingTimer };