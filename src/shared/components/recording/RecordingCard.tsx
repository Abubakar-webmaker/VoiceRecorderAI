/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals */
import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { BodySm, Caption, MonoText } from '@components/common/Typography';
import { Badge }    from '@components/common/Badge';
import useTheme     from '@hooks/useTheme';
import {
  formatDuration,
  formatFileSize,
  AIStatus,
  type Recording,
} from '@types/recording.types';

interface RecordingCardProps {
  recording:    Recording;
  onPress:      () => void;
  onPlay:       () => void;
  onFavorite:   () => void;
  onDelete:     () => void;
  isSelected?:  boolean;
  onSelect?:    () => void;
  isSelecting?: boolean;
  style?:       ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const RecordingCard = ({
  recording,
  onPress,
  onPlay,
  onFavorite,
  onDelete,
  isSelected  = false,
  onSelect,
  isSelecting = false,
  style,
}: RecordingCardProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = useCallback(() => { scale.value = withSpring(0.97); }, [scale]);
  const handlePressOut = useCallback(() => { scale.value = withSpring(1); }, [scale]);

  const handlePress = useCallback(() => {
    if (isSelecting && onSelect) { onSelect(); return; }
    onPress();
  }, [isSelecting, onSelect, onPress]);

  const aiStatus = recording.ai.transcriptionStatus;
  const isTranscribed = aiStatus === AIStatus.COMPLETED;

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? colors.primary.muted
            : colors.bg.elevated,
          borderColor: isSelected
            ? `${colors.primary.default}50`
            : colors.border.default,
          borderRadius: borderRadius.xl,
          marginBottom: spacing[3],
        },
        style,
      ]}
    >
      <AnimatedTouchable style={animStyle}>
        {/* ─── Top Row ──────────────────────────────────── */}
        <View style={styles.topRow}>
          {/* Selection checkbox */}
          {isSelecting && (
            <View
              style={[
                styles.checkbox,
                {
                  borderColor:     isSelected ? colors.primary.default : colors.border.default,
                  backgroundColor: isSelected ? colors.primary.default : colors.bg.elevated,
                },
              ]}
            >
              {isSelected && (
                <Caption style={[styles.whiteTextSm, { color: colors.text.inverse }]}>✓</Caption>
              )}
            </View>
          )}

          {/* Title + date */}
          <View style={styles.flex1}>
            <BodySm
              color="primary"
              numberOfLines={1}
              style={styles.recordingTitle}
            >
              {recording.title}
            </BodySm>
            <Caption color="tertiary" style={styles.recordingDate}>
              {new Date(recording.recordedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </Caption>
          </View>

          {/* Favorite */}
          <TouchableOpacity
            onPress={onFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Caption style={styles.favIcon}>
              {recording.isFavorite ? '💛' : '🤍'}
            </Caption>
          </TouchableOpacity>
        </View>

        {/* ─── Bottom Row ───────────────────────────────── */}
        <View style={[styles.bottomRow, { marginTop: spacing[2] }]}>
          {/* Duration + size */}
          <View style={styles.metaRow}>
            <MonoText style={[styles.durationText, { color: colors.text.secondary }]}>
              {formatDuration(recording.duration)}
            </MonoText>
            <Caption color="tertiary">·</Caption>
            <Caption color="tertiary">
              {formatFileSize(recording.fileSize)}
            </Caption>
          </View>

          {/* AI badge */}
          {isTranscribed && (
            <Badge label="AI ✓" variant="success" size="sm" />
          )}
          {aiStatus === AIStatus.PROCESSING && (
            <Badge label="Processing..." variant="primary" size="sm" />
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {/* Play */}
            <TouchableOpacity
              onPress={onPlay}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary.default },
              ]}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Caption style={[styles.whiteTextSm, { color: colors.text.inverse }]}>▶</Caption>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={onDelete}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.error.surface },
              ]}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Caption style={[styles.deleteIcon, { color: colors.error.text }]}>🗑</Caption>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedTouchable>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    width:          28,
    height:         28,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  actions: {
    flexDirection: 'row',
    gap:           6,
  } as ViewStyle,
  bottomRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  card: {
    padding:     14,
    borderWidth: 1,
  } as ViewStyle,
  checkbox: {
    width:          20,
    height:         20,
    borderRadius:   6,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  deleteIcon: {
    fontSize: 10
  },
  durationText: {
    fontSize: 12
  },
  favIcon: {
    fontSize: 16
  },
  flex1: {
    flex: 1
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    flex:          1,
  } as ViewStyle,
  recordingDate: {
    marginTop: 2
  },
  recordingTitle: {
    fontWeight: '600'
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  } as ViewStyle,
  whiteTextSm: {
    fontSize: 10
  },
});

export { RecordingCard };
