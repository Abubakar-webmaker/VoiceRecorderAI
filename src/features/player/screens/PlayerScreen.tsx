import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { State as TrackState } from 'react-native-track-player';

import { WaveformView }   from '@components/recording/WaveformView';
import {
  H4, H5, BodySm, Caption, MonoText, Label,
} from '@components/common/Typography';
import { Badge }          from '@components/common/Badge';
import useTheme           from '@hooks/useTheme';
import usePlayer          from '../hooks/usePlayer';
import {
  formatDuration,
  SPEED_OPTIONS,
  type SpeedOption,
} from '@features/player/store/playerSlice';
export { formatDuration } from '@types/recording.types';

const { width: W, height: H } = Dimensions.get('window');

// ─── Seek Bar ─────────────────────────────────────────────────────
interface SeekBarProps {
  position: number;
  duration: number;
  onSeek:   (seconds: number) => void;
}

const SeekBar = ({ position, duration, onSeek }: SeekBarProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={{ gap: spacing[1.5] }}>
      {/* Track */}
      <View
        style={[
          styles.seekTrack,
          { backgroundColor: colors.border.default, borderRadius: borderRadius.full },
        ]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const ratio  = e.nativeEvent.locationX / (W - 40);
          const newPos = Math.max(0, Math.min(duration, ratio * duration));
          onSeek(newPos);
        }}
        onResponderMove={(e) => {
          const ratio  = e.nativeEvent.locationX / (W - 40);
          const newPos = Math.max(0, Math.min(duration, ratio * duration));
          onSeek(newPos);
        }}
      >
        {/* Fill */}
        <View
          style={[
            styles.seekFill,
            {
              width:           `${progress * 100}%`,
              backgroundColor: colors.primary.default,
              borderRadius:    borderRadius.full,
            },
          ]}
        />
        {/* Thumb */}
        <View
          style={[
            styles.seekThumb,
            {
              left:            `${progress * 100}%`,
              backgroundColor: colors.primary.default,
            },
          ]}
        />
      </View>

      {/* Times */}
      <View style={styles.timesRow}>
        <MonoText style={{ color: colors.text.secondary, fontSize: 12 }}>
          {formatDuration(Math.floor(position))}
        </MonoText>
        <MonoText style={{ color: colors.text.tertiary, fontSize: 12 }}>
          -{formatDuration(Math.max(0, Math.floor(duration - position)))}
        </MonoText>
      </View>
    </View>
  );
};

// ─── Speed Selector ───────────────────────────────────────────────
interface SpeedSelectorProps {
  current:  SpeedOption;
  onChange: (speed: SpeedOption) => void;
}

const SpeedSelector = ({ current, onChange }: SpeedSelectorProps): React.JSX.Element => {
  const { colors, borderRadius } = useTheme();
  return (
    <View style={styles.speedRow}>
      {SPEED_OPTIONS.map((speed) => (
        <TouchableOpacity
          key={speed}
          onPress={() => onChange(speed)}
          style={[
            styles.speedBtn,
            {
              backgroundColor: current === speed
                ? colors.primary.muted
                : colors.bg.elevated,
              borderColor: current === speed
                ? `${colors.primary.default}40`
                : colors.border.default,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Caption
            style={{
              color: current === speed
                ? colors.primary.light
                : colors.text.secondary,
              fontWeight: current === speed ? '700' : '400',
            }}
          >
            {speed}x
          </Caption>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Main Controls ────────────────────────────────────────────────
interface MainControlsProps {
  isPlaying:  boolean;
  isLoading:  boolean;
  onPlay:     () => void;
  onSkipBwd:  () => void;
  onSkipFwd:  () => void;
}

const MainControls = ({
  isPlaying, isLoading, onPlay, onSkipBwd, onSkipFwd,
}: MainControlsProps): React.JSX.Element => {
  const { colors, componentSize } = useTheme();
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handlePlayPress = (): void => {
    btnScale.value = withSpring(0.92, { damping: 12, stiffness: 400 }, () => {
      btnScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    onPlay();
  };

  return (
    <View style={styles.controls}>
      {/* Skip -15 */}
      <TouchableOpacity onPress={onSkipBwd} style={styles.skipBtn}>
        <Caption style={{ fontSize: 28, color: colors.text.secondary }}>⏮</Caption>
        <Caption style={{ color: colors.text.tertiary, fontSize: 10 }}>15s</Caption>
      </TouchableOpacity>

      {/* Play / Pause */}
      <Animated.View style={btnStyle}>
        <TouchableOpacity
          onPress={handlePlayPress}
          disabled={isLoading}
          style={[
            styles.playBtn,
            {
              backgroundColor: colors.primary.default,
              width:           componentSize.recordBtnMd,
              height:          componentSize.recordBtnMd,
              borderRadius:    componentSize.recordBtnMd / 2,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Caption
            style={{
              fontSize: 28,
              color:    '#fff',
              includeFontPadding: false,
            }}
          >
            {isLoading ? '⟳' : isPlaying ? '⏸' : '▶'}
          </Caption>
        </TouchableOpacity>
      </Animated.View>

      {/* Skip +15 */}
      <TouchableOpacity onPress={onSkipFwd} style={styles.skipBtn}>
        <Caption style={{ fontSize: 28, color: colors.text.secondary }}>⏭</Caption>
        <Caption style={{ color: colors.text.tertiary, fontSize: 10 }}>15s</Caption>
      </TouchableOpacity>
    </View>
  );
};

// ─── Player Screen ────────────────────────────────────────────────
const PlayerScreen = (): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const {
    currentRecording, position, duration, speed,
    isPlaying, isLoading, progressPercent,
    togglePlay, seek, changeSpeed, skipFwd, skipBwd, stop,
    showMini,
  } = usePlayer();

  if (!currentRecording) return <></>;

  const date = new Date(currentRecording.recordedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingHorizontal: spacing[5] }]}
      >
        <TouchableOpacity onPress={() => showMini(true)}>
          <Caption style={{ fontSize: 20, color: colors.text.secondary }}>⌄</Caption>
        </TouchableOpacity>
        <Caption color="secondary">Now Playing</Caption>
        <TouchableOpacity onPress={() => {}}>
          <Caption style={{ fontSize: 20, color: colors.text.secondary }}>⋯</Caption>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Waveform Artwork ────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(400)}
        style={[
          styles.artwork,
          {
            backgroundColor: colors.bg.secondary,
            marginHorizontal: spacing[5],
            borderRadius:    borderRadius['2xl'],
          },
        ]}
      >
        <WaveformView
          waveform={currentRecording.waveform}
          progress={progressPercent}
          width={W - spacing[5] * 2 - spacing[4] * 2}
          height={120}
          barWidth={4}
          barGap={2.5}
          activeColor={colors.primary.default}
          inactiveColor={`${colors.primary.default}20`}
        />
      </Animated.View>

      {/* ─── Track Info ──────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(150).duration(400)}
        style={[styles.trackInfo, { paddingHorizontal: spacing[5] }]}
      >
        <View style={{ flex: 1 }}>
          <H4 color="primary" numberOfLines={2}>
            {currentRecording.title}
          </H4>
          <BodySm color="secondary" style={{ marginTop: 4 }}>
            {date} · {currentRecording.format.toUpperCase()}
          </BodySm>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Caption style={{ fontSize: 22 }}>
            {currentRecording.isFavorite ? '💛' : '🤍'}
          </Caption>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Seek Bar ────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={{ paddingHorizontal: spacing[5] }}
      >
        <SeekBar
          position={position}
          duration={duration || currentRecording.duration}
          onSeek={(s) => seek(s)}
        />
      </Animated.View>

      {/* ─── Main Controls ───────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(250).duration(400)}
        style={{ paddingHorizontal: spacing[5] }}
      >
        <MainControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlay={togglePlay}
          onSkipBwd={skipBwd}
          onSkipFwd={skipFwd}
        />
      </Animated.View>

      {/* ─── Speed ───────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={{ paddingHorizontal: spacing[5] }}
      >
        <View style={[styles.speedSection, { gap: spacing[2] }]}>
          <Caption color="tertiary" align="center">Playback Speed</Caption>
          <SpeedSelector
            current={speed}
            onChange={changeSpeed}
          />
        </View>
      </Animated.View>

      {/* ─── Extra Controls ──────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(350).duration(400)}
        style={[styles.extraControls, { paddingHorizontal: spacing[5] }]}
      >
        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: colors.bg.elevated }]}
          onPress={stop}
        >
          <Caption style={{ fontSize: 18 }}>⏹</Caption>
          <Caption color="tertiary">Stop</Caption>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: colors.bg.elevated }]}
        >
          <Caption style={{ fontSize: 18 }}>🔁</Caption>
          <Caption color="tertiary">Repeat</Caption>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: colors.bg.elevated }]}
        >
          <Caption style={{ fontSize: 18 }}>💤</Caption>
          <Caption color="tertiary">Sleep</Caption>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.extraBtn, { backgroundColor: colors.ai.surface }]}
        >
          <Caption style={{ fontSize: 18 }}>🤖</Caption>
          <Caption style={{ color: colors.ai.default }}>AI</Caption>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen:      { flex: 1 } as ViewStyle,
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  } as ViewStyle,
  artwork: {
    padding:        20,
    marginVertical: 16,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  trackInfo: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   20,
  } as ViewStyle,
  seekTrack: {
    height:   6,
    width:    '100%',
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  seekFill: {
    position: 'absolute',
    left:     0,
    top:      0,
    bottom:   0,
  } as ViewStyle,
  seekThumb: {
    position:    'absolute',
    width:       16,
    height:      16,
    borderRadius: 8,
    top:         -5,
    marginLeft:  -8,
  } as ViewStyle,
  timesRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  controls: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            24,
    paddingVertical: 24,
  } as ViewStyle,
  skipBtn: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          56,
    height:         56,
    gap:            2,
  } as ViewStyle,
  playBtn: {
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#6366F1',
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.5,
    shadowRadius:   20,
    elevation:      10,
  } as ViewStyle,
  speedSection: {
    marginTop: 8,
  } as ViewStyle,
  speedRow: {
    flexDirection: 'row',
    gap:           6,
  } as ViewStyle,
  speedBtn: {
    flex:            1,
    height:          36,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
  } as ViewStyle,
  extraControls: {
    flexDirection:  'row',
    gap:            10,
    marginTop:      20,
  } as ViewStyle,
  extraBtn: {
    flex:           1,
    height:         60,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
  } as ViewStyle,
});

export { PlayerScreen };