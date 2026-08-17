/* eslint-disable react-native/no-inline-styles */
import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Caption, BodySm } from '@components/common/Typography';
import useTheme             from '@hooks/useTheme';

// ─── Record Button ────────────────────────────────────────────────
interface RecordButtonProps {
  onPress:     () => void;
  isRecording: boolean;
  isPaused:    boolean;
  isDisabled:  boolean;
}

const RecordButton = ({
  onPress,
  isRecording,
  isPaused,
  isDisabled,
}: RecordButtonProps): React.JSX.Element => {
  const { colors } = useTheme();

  const pulse   = useSharedValue(1);
  const ringOp  = useSharedValue(0);

  useEffect(() => {
    if (isRecording && !isPaused) {
      // Breathing pulse
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1,    { duration: 1000 }),
        ),
        -1, false,
      );
      // Pulse ring
      ringOp.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(0,   { duration: 1200 }),
        ),
        -1, false,
      );
    } else {
      pulse.value  = withSpring(1);
      ringOp.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording, isPaused, pulse, ringOp]);

  const btnStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOp.value }));

  const handlePress = (): void => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    onPress();
  };

  const SIZE       = 80;
  const RING_SIZE  = SIZE + 24;

  return (
    <View style={styles.recordButtonWrapper}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width:           RING_SIZE,
            height:          RING_SIZE,
            borderRadius:    RING_SIZE / 2,
            borderColor:     colors.recording.default,
          },
          ringStyle,
        ]}
      />

      {/* Button */}
      <Animated.View style={btnStyle}>
        <TouchableOpacity
          onPress={() => { handlePress(); }}
          disabled={isDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          style={[
              styles.recordBtnMain,
              {
                width:           SIZE,
                height:          SIZE,
                borderRadius:    SIZE / 2,
                backgroundColor: isDisabled
                  ? `${colors.recording.default}50`
                  : colors.recording.default,
                shadowColor:    colors.recording.default,
                shadowOpacity:  isRecording ? 0.7 : 0.4,
                shadowRadius:   isRecording ? 24 : 12,
                elevation:      isRecording ? 12 : 6,
              }
          ]}
        >
          {/* Icon: square when recording, circle when idle */}
          <View
            style={[
              styles.recordBtnIcon,
              {
                width:           isRecording ? 28 : 36,
                height:          isRecording ? 28 : 36,
                borderRadius:    isRecording ? 6 : 36,
                backgroundColor: colors.text.inverse,
              }
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Pause/Resume Button ──────────────────────────────────────────
interface ControlBtnProps {
  icon:     string;
  label:    string;
  onPress:  () => void;
  color?:   string;
  bgColor?: string;
  size?:    number;
}

const ControlBtn = ({
  icon, label, onPress, color, bgColor, size = 56,
}: ControlBtnProps): React.JSX.Element => {
  const { colors } = useTheme();
  const bg         = bgColor ?? colors.bg.elevated;
  const textColor  = color   ?? colors.text.secondary;

  return (
    <TouchableOpacity
      onPress={() => {
        ReactNativeHapticFeedback.trigger('impactLight');
        onPress();
      }}
      style={[
        styles.controlBtn,
        {
          width:          size,
          height:         size,
          borderRadius:   size / 2,
          backgroundColor: bg,
        }
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Caption style={styles.controlBtnIcon}><Text>{icon}</Text></Caption>
      <Caption style={[styles.controlBtnLabel, { color: textColor }]}>
        <Text>{label.toUpperCase()}</Text>
      </Caption>
    </TouchableOpacity>
  );
};

// ─── Main Recording Controls ──────────────────────────────────────
interface RecordingControlsProps {
  isRecording:  boolean;
  isPaused:     boolean;
  isDisabled:   boolean;
  onRecord:     () => void;
  onPause:      () => void;
  onResume:     () => void;
  onStop:       () => void;
  onDiscard:    () => void;
}

const RecordingControls = ({
  isRecording,
  isPaused,
  isDisabled,
  onRecord,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: RecordingControlsProps): React.JSX.Element => {
  const { colors } = useTheme();
  const isActive   = isRecording || isPaused;

  return (
    <View style={styles.container}>
      {isActive ? (
        // ─── Active recording controls ─────────────────────────
        <View style={styles.activeRow}>
          {/* Discard */}
          <ControlBtn
            icon="✕"
            label="Discard"
            onPress={() => { onDiscard(); }}
            bgColor={colors.error.surface}
            color={colors.error.text}
          />

          {/* Stop (center — primary action) */}
          <RecordButton
            onPress={() => { onStop(); }}
            isRecording={isRecording}
            isPaused={isPaused}
            isDisabled={isDisabled}
          />

          {/* Pause / Resume */}
          <ControlBtn
            icon={isPaused ? '▶' : '⏸'}
            label={isPaused ? 'Resume' : 'Pause'}
            onPress={() => { isPaused ? onResume() : onPause(); }}
            bgColor={colors.bg.elevated}
          />
        </View>
      ) : (
        // ─── Idle state ────────────────────────────────────────
        <RecordButton
          onPress={() => { onRecord(); }}
          isRecording={false}
          isPaused={false}
          isDisabled={isDisabled}
        />
      )}

      {/* Label */}
      <BodySm
        color="secondary"
        align="center"
        style={styles.statusLabel}
      >
        <BodySm>
          {isPaused
            ? 'Recording paused — tap ▶ to resume or ⏹ to finish'
            : isRecording
            ? 'Tap ⏹ to finish recording'
            : 'Tap to start recording'}
        </BodySm>
      </BodySm>
    </View>
  );
};

const styles = StyleSheet.create({
  activeRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            28,
  } as ViewStyle,
  container: {
    alignItems: 'center',
  } as ViewStyle,
  controlBtn: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  } as ViewStyle,
  controlBtnIcon: {
    fontSize: 22,
  },
  controlBtnLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  pulseRing: {
    borderWidth:     2,
    position:        'absolute',
  },
  recordBtnIcon: {
  },
  recordBtnMain: {
    alignItems:     'center',
    justifyContent: 'center',
    shadowOffset:   { width: 0, height: 0 },
  },
  recordButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    marginTop: 12,
  } as ViewStyle,
});

export { RecordingControls };
