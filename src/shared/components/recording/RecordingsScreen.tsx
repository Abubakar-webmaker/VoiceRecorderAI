import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import { WaveformView }   from './WaveformView';
import { Typography, BodySm, Caption, Label } from '@components/common/Typography';
import { Badge }          from '@components/common/Badge';
import useTheme           from '@hooks/useTheme';
import {
  type Recording,
  AIStatus,
  formatDuration,
  formatFileSize,
  getAIStatusColor,
} from '@types/recording.types';

const { width: W } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH    = 160; // Total swipe action area

interface RecordingCardProps {
  recording:      Recording;
  onPress:        () => void;
  onPlay:         () => void;
  onFavorite:     () => void;
  onDelete:       () => void;
  isSelected?:    boolean;
  onSelect?:      () => void;
  isSelecting?:   boolean;
  style?:         ViewStyle;
}

const RecordingCard = ({
  recording,
  onPress,
  onPlay,
  onFavorite,
  onDelete,
  isSelected   = false,
  onSelect,
  isSelecting  = false,
  style,
}: RecordingCardProps): React.JSX.Element => {
  const { colors, spacing, borderRadius, textStyles } = useTheme();

  const translateX = useSharedValue(0);
  const cardScale  = useSharedValue(1);

  // ─── Swipe Gesture ────────────────────────────────────────────
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      // Left swipe only
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -ACTION_WIDTH);
      } else if (translateX.value < 0) {
        translateX.value = Math.min(0, translateX.value + e.translationX);
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-ACTION_WIDTH, { damping: 15, stiffness: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
      }
    });

  const cardStyle    = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value },
    ],
  }));

  const actionsVisible = useAnimatedStyle(() => ({
    opacity: withTiming(translateX.value < -20 ? 1 : 0, { duration: 150 }),
  }));

  const handleClose = useCallback((): void => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
  }, [translateX]);

  // ─── Format Helpers ───────────────────────────────────────────
  const date = new Date(recording.recordedAt).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });

  const transcriptionStatus = recording.ai.transcriptionStatus;
  const hasAI               = transcriptionStatus === AIStatus.COMPLETED;
  const isProcessing        = transcriptionStatus === AIStatus.PROCESSING;

  const aiColor = getAIStatusColor(transcriptionStatus);

  // ─── Selection mode ───────────────────────────────────────────
  if (isSelecting) {
    return (
      <TouchableOpacity
        onPress={onSelect}
        style={[
          styles.card,
          {
            backgroundColor: isSelected
              ? colors.primary.surface
              : colors.card,
            borderColor: isSelected
              ? colors.primary.default
              : colors.border.default,
          },
          style,
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.selectIndicator}>
          <View
            style={[
              styles.selectCircle,
              {
                borderColor:     colors.primary.default,
                backgroundColor: isSelected
                  ? colors.primary.default
                  : 'transparent',
              },
            ]}
          >
            {isSelected && (
              <Caption style={{ color: '#fff', fontSize: 10 }}>✓</Caption>
            )}
          </View>
        </View>
        <CardContent recording={recording} date={date} hasAI={hasAI} />
      </TouchableOpacity>
    );
  }

  // ─── Normal mode ──────────────────────────────────────────────
  return (
    <View style={[styles.cardWrapper, style]}>
      {/* Swipe Action Buttons */}
      <Animated.View style={[styles.actions, actionsVisible]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.ai.surface }]}
          onPress={() => { handleClose(); onFavorite(); }}
        >
          <Typography variant="bodyLg">
            {recording.isFavorite ? '💛' : '🤍'}
          </Typography>
          <Caption style={{ color: colors.ai.default, marginTop: 2 }}>
            {recording.isFavorite ? 'Unfav' : 'Fav'}
          </Caption>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.error.surface }]}
          onPress={() => { handleClose(); onDelete(); }}
        >
          <Typography variant="bodyLg">🗑</Typography>
          <Caption style={{ color: colors.error.text, marginTop: 2 }}>Delete</Caption>
        </TouchableOpacity>
      </Animated.View>

      {/* Card */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={cardStyle}>
          <TouchableOpacity
            onPress={onPress}
            onLongPress={onSelect}
            activeOpacity={0.85}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor:     colors.border.default,
              },
            ]}
          >
            <CardContent recording={recording} date={date} hasAI={hasAI} />

            {/* Play Button */}
            <TouchableOpacity
              onPress={onPlay}
              style={[
                styles.playBtn,
                { backgroundColor: colors.primary.muted },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Caption style={{ color: colors.primary.default, fontSize: 16 }}>
                ▶
              </Caption>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── Card Content (shared between modes) ──────────────────────────
interface CardContentProps {
  recording: Recording;
  date:      string;
  hasAI:     boolean;
}

const CardContent = ({
  recording,
  date,
  hasAI,
}: CardContentProps): React.JSX.Element => {
  const { colors, spacing } = useTheme();

  return (
    <View style={styles.content}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <Typography
          variant="h6"
          color="primary"
          numberOfLines={1}
          style={{ flex: 1, marginRight: spacing[2] }}
        >
          {recording.title}
        </Typography>
        {recording.isFavorite && (
          <Caption style={{ fontSize: 14 }}>💛</Caption>
        )}
      </View>

      {/* Meta Row */}
      <View style={[styles.metaRow, { marginTop: spacing[1] }]}>
        <Caption
          style={{ color: colors.text.secondary }}
        >
          {formatDuration(recording.duration)}
        </Caption>
        <View style={styles.dot} />
        <Caption style={{ color: colors.text.tertiary }}>
          {recording.format.toUpperCase()}
        </Caption>
        <View style={styles.dot} />
        <Caption style={{ color: colors.text.tertiary }}>
          {date}
        </Caption>
      </View>

      {/* Waveform + Badges */}
      <View style={[styles.bottomRow, { marginTop: spacing[2] }]}>
        <WaveformView
          waveform={recording.waveform}
          width={180}
          height={28}
          barWidth={2}
          barGap={1.5}
          inactiveColor={`${colors.primary.default}30`}
          activeColor={colors.primary.default}
        />

        {/* AI Badge */}
        {hasAI && (
          <Badge label="AI" variant="ai" size="sm" />
        )}
        {recording.ai.transcriptionStatus === AIStatus.PROCESSING && (
          <Badge label="⟳ AI" variant="warning" size="sm" />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    marginBottom: 10,
  } as ViewStyle,
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         14,
    borderRadius:    16,
    borderWidth:     1,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
  } as ViewStyle,
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  } as ViewStyle,
  dot: {
    width:           3,
    height:          3,
    borderRadius:    1.5,
    backgroundColor: '#3D4F73',
  } as ViewStyle,
  bottomRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  playBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     10,
  } as ViewStyle,
  actions: {
    position:       'absolute',
    right:          0,
    top:            0,
    bottom:         0,
    flexDirection:  'row',
    borderRadius:   16,
    overflow:       'hidden',
  } as ViewStyle,
  actionBtn: {
    width:          80,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  } as ViewStyle,
  selectIndicator: {
    width:          48,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  selectCircle: {
    width:          24,
    height:         24,
    borderRadius:   12,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
});

export { RecordingCard };