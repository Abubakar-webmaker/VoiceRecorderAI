import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown, FadeOutDown,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { State as TrackState } from 'react-native-track-player';

import { WaveformView }  from '@components/recording/WaveformView';
import { BodySm, Caption, MonoText } from '@components/common/Typography';
import useTheme          from '@hooks/useTheme';
import usePlayer         from '@features/player/hooks/usePlayer';
import { formatDuration } from '@types/recording.types';

interface MiniPlayerProps {
  onExpand: () => void;
}

const MiniPlayer = ({ onExpand }: MiniPlayerProps): React.JSX.Element | null => {
  const { colors, spacing, borderRadius, componentSize } = useTheme();
  const {
    currentRecording, isPlaying, isLoading,
    progressPercent, position, duration,
    togglePlay, stop, isMiniPlayer,
  } = usePlayer();

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handlePlayPress = useCallback((): void => {
    btnScale.value = withSpring(0.88, { damping: 12, stiffness: 400 }, () => {
      btnScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    togglePlay();
  }, [togglePlay, btnScale]);

  if (!currentRecording || !isMiniPlayer) return null;

  const remaining = Math.max(0, Math.floor((duration || currentRecording.duration) - position));

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: colors.bg.elevated,
          borderTopColor:  colors.border.default,
          paddingBottom:   Platform.OS === 'ios' ? spacing[6] : spacing[3],
        },
      ]}
    >
      {/* Progress bar */}
      <View
        style={[
          styles.progressBar,
          { backgroundColor: colors.border.default },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width:           `${progressPercent * 100}%`,
              backgroundColor: colors.primary.default,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        onPress={onExpand}
        activeOpacity={0.9}
        style={[styles.content, { paddingHorizontal: spacing[4] }]}
      >
        {/* Waveform thumbnail */}
        <View
          style={[
            styles.waveThumb,
            {
              backgroundColor: colors.bg.secondary,
              borderRadius:    borderRadius.md,
            },
          ]}
        >
          <WaveformView
            waveform={currentRecording.waveform}
            progress={progressPercent}
            width={44}
            height={28}
            barWidth={2}
            barGap={1.5}
            activeColor={colors.primary.default}
            inactiveColor={`${colors.primary.default}25`}
          />
        </View>

        {/* Track info */}
        <View style={styles.info}>
          <BodySm color="primary" numberOfLines={1} style={{ fontWeight: '600' }}>
            {currentRecording.title}
          </BodySm>
          <MonoText style={{ color: colors.text.tertiary, fontSize: 11 }}>
            -{formatDuration(remaining)}
          </MonoText>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Play / Pause */}
          <Animated.View style={btnStyle}>
            <TouchableOpacity
              onPress={handlePlayPress}
              disabled={isLoading}
              style={[
                styles.playBtn,
                {
                  backgroundColor: colors.primary.default,
                  width:           componentSize.iconMd + 12,
                  height:          componentSize.iconMd + 12,
                  borderRadius:    (componentSize.iconMd + 12) / 2,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              <Caption style={{ color: '#fff', fontSize: 14 }}>
                {isLoading ? '⟳' : isPlaying ? '⏸' : '▶'}
              </Caption>
            </TouchableOpacity>
          </Animated.View>

          {/* Stop / Close */}
          <TouchableOpacity
            onPress={stop}
            style={[
              styles.stopBtn,
              { backgroundColor: colors.bg.secondary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Stop playback"
          >
            <Caption style={{ color: colors.text.secondary, fontSize: 14 }}>✕</Caption>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position:    'absolute',
    bottom:      0,
    left:        0,
    right:       0,
    borderTopWidth: 1,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: -4 },
    shadowOpacity:  0.3,
    shadowRadius:   12,
    elevation:      16,
  } as ViewStyle,
  progressBar: {
    height:   2,
    width:    '100%',
  } as ViewStyle,
  progressFill: {
    height: '100%',
  } as ViewStyle,
  content: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     10,
    gap:            12,
  } as ViewStyle,
  waveThumb: {
    padding:        6,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  info: {
    flex:    1,
    gap:     2,
  } as ViewStyle,
  controls: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  } as ViewStyle,
  playBtn: {
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  stopBtn: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
});

export { MiniPlayer };
