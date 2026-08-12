import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Text,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { RecordingTimer }    from '../components/RecordingTimer';
import { LiveWaveform }      from '../components/LiveWaveform';
import { RecordingControls } from '../components/RecordingControls';
import {
  H4, BodySm, Caption,
} from '@components/common/Typography';
import { Card }    from '@components/common/Card';
import { Badge }   from '@components/common/Badge';
import { Loader }  from '@components/common/Loader';
import useTheme    from '@hooks/useTheme';
import useRecorder from '../hooks/useRecorder';
import { RecorderState } from '../store/recorderSlice';
import { selectFolders }  from '@features/folder/store/folderSlice';
import useAppSelector     from '@hooks/useAppSelector';
import { formatDuration, formatFileSize } from '@shared/types/recording.types';
import type { MainTabParamList } from '@navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { Recording } from '@shared/types/recording.types';

const { width: W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────
interface UploadingViewProps {
  progress: number;
  title:    string;
}

// ─── Upload Progress Screen ───────────────────────────────────────
const UploadingView = ({
  progress,
  title,
}: UploadingViewProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withSpring(progress / 100, { damping: 20, stiffness: 100 });
  }, [fillWidth, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  return (
    <View style={styles.uploadingContainer}>
      <Loader variant="ai" color={colors.primary.default} size="lg" />

      <H4 color="primary" align="center" style={[styles.uploadTitle, { marginTop: spacing[4] }]}>
        <Text>Uploading to Cloud</Text>
      </H4>
      <BodySm color="secondary" align="center" numberOfLines={2}>
        {title}
      </BodySm>

      {/* Progress bar */}
      <View
        style={[
          styles.uploadTrack,
          {
            backgroundColor: colors.border.default,
            borderRadius:    borderRadius.full,
            marginTop:       spacing[6],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.uploadFill,
            {
              backgroundColor: colors.primary.default,
              borderRadius:    borderRadius.full,
            },
            fillStyle,
          ]}
        />
      </View>

      <Caption color="secondary" style={[styles.progressText, { marginTop: spacing[2] }]}>
        {progress}
        <Text>% uploaded</Text>
      </Caption>
    </View>
  );
};

// ─── Done Screen ──────────────────────────────────────────────────
const DoneView = ({
  recording,
  onViewRecording,
  onRecordAnother,
}: {
  recording:       Recording;
  onViewRecording: () => void;
  onRecordAnother: () => void;
}): React.JSX.Element => {
  const { colors, spacing } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.doneContainer}
    >
      <View
        style={[
          styles.doneIcon,
          { backgroundColor: colors.ai.surface },
        ]}
      >
        <Text style={styles.doneIconText}>✅</Text>
      </View>

      <H4 color="primary" align="center">
        <Text>Recording Saved!</Text>
      </H4>
      <BodySm color="secondary" align="center">
        {recording.title}
      </BodySm>

      {/* Stats */}
      <Card variant="outlined" style={styles.doneCard}>
        <View style={{ gap: spacing[2] }}>
          {[
            { label: 'Duration',  value: formatDuration(recording.duration) },
            { label: 'File Size', value: formatFileSize(recording.fileSize) },
            { label: 'Format',    value: recording.format.toUpperCase() },
          ].map(({ label, value }) => (
            <View key={label} style={styles.doneStatRow}>
              <Caption color="tertiary">{label}</Caption>
              <Caption color="secondary">{value}</Caption>
            </View>
          ))}
        </View>
      </Card>

      {/* Actions */}
      <View style={[styles.doneActions, { marginTop: spacing[5] }]}>
        <TouchableOpacity
          onPress={onViewRecording}
          style={[
            styles.doneBtn,
            { backgroundColor: colors.primary.default },
          ]}
        >
          <BodySm style={[styles.doneBtnText, { color: colors.text.inverse }]}>
            <Text>View Recording</Text>
          </BodySm>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRecordAnother}
          style={[styles.recordAnotherBtn, { borderColor: colors.border.default }]}
        >
          <BodySm color="secondary" style={styles.recordAnotherText}>
            <Text>Record Another</Text>
          </BodySm>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Record Screen ────────────────────────────────────────────────
const RecordScreen = ({ navigation }: { navigation: BottomTabNavigationProp<MainTabParamList> }): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const folders = useAppSelector(selectFolders);
  const titleRef = useRef<TextInput>(null);

  const {
    recorderState, duration, amplitudeList,
    title, folderId, uploadProgress, uploadedRecording, error,
    isRecording, isPaused, isUploading, isDone, isIdle,
    start, pause, resume, stop, discard, reset, setFolder,
  } = useRecorder();

  const [localTitle, setLocalTitle] = useState('');
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  // Sync localTitle with Redux title
  useEffect(() => {
    if (title) setLocalTitle(title);
  }, [title]);

  // Show error
  useEffect(() => {
    if (error) {
      Alert.alert('Recording Error', error, [
        { text: 'OK', onPress: reset },
      ]);
    }
  }, [error, reset]);

  const handleStart = useCallback((): void => {
    const finalTitle = localTitle.trim() || undefined;
    void start({ title: finalTitle, folderId });
  }, [localTitle, folderId, start]);

  const handleStop = useCallback((): void => {
    Alert.alert(
      'Finish Recording',
      'Stop recording and save to cloud?',
      [
        { text: 'Continue Recording', style: 'cancel' },
        {
          text:  'Stop & Save',
          style: 'default',
          onPress: () => void stop(),
        },
      ],
    );
  }, [stop]);

  const handleDiscard = useCallback((): void => {
    Alert.alert(
      'Discard Recording',
      'Are you sure? This recording will be permanently deleted.',
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text:    'Discard',
          style:   'destructive',
          onPress: () => void discard(),
        },
      ],
    );
  }, [discard]);

  const handleViewRecording = useCallback((): void => {
    if (!uploadedRecording) return;
    reset();
    navigation.navigate('RecordingsTab' as never, {
      screen: 'RecordingDetail',
      params: { recordingId: uploadedRecording._id },
    } as never);
  }, [uploadedRecording, reset, navigation]);

  const selectedFolder = folders.find((f) => f._id === folderId);

  // ─── Upload state ────────────────────────────────────────────
  if (isUploading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.primary }]}>
        <UploadingView
          progress={uploadProgress}
          title={title || 'Recording'}
        />
      </View>
    );
  }

  // ─── Done state ──────────────────────────────────────────────
  if (isDone && uploadedRecording) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.primary }]}>
        <DoneView
          recording={uploadedRecording}
          onViewRecording={handleViewRecording}
          onRecordAnother={reset}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: spacing[5] },
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isRecording}
      >
        {/* ─── Header ──────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={styles.header}
        >
          <H4 color="primary">
            <Text>New Recording</Text>
          </H4>
          {isRecording && (
            <Badge label="● REC" variant="error" size="sm" />
          )}
          {isPaused && (
            <Badge label="⏸ PAUSED" variant="warning" size="sm" />
          )}
        </Animated.View>

        {/* ─── Title Input ─────────────────────────────────── */}
        {!isRecording && !isPaused && (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <View
              style={[
                styles.titleInput,
                {
                  backgroundColor: colors.bg.input,
                  borderColor:     colors.border.default,
                  borderRadius:    borderRadius.lg,
                },
              ]}
            >
              <Caption color="tertiary" style={styles.titleLabel}>
                <Text>Title (optional)</Text>
              </Caption>
              <TextInput
                ref={titleRef}
                value={localTitle}
                onChangeText={setLocalTitle}
                placeholder="e.g. Team Meeting Notes"
                placeholderTextColor={colors.text.tertiary}
                style={[
                  styles.titleTextInput,
                  { color: colors.text.primary }
                ]}
                maxLength={100}
                returnKeyType="done"
              />
            </View>
          </Animated.View>
        )}

        {/* ─── Folder Selector ─────────────────────────────── */}
        {!isRecording && !isPaused && (
          <Animated.View entering={FadeInDown.delay(140).duration(400)}>
            <TouchableOpacity
              onPress={() => setShowFolderPicker(true)}
              style={[
                styles.folderSelector,
                {
                  backgroundColor: colors.bg.elevated,
                  borderColor:     colors.border.default,
                  borderRadius:    borderRadius.lg,
                },
              ]}
            >
              <Caption style={styles.folderIcon}>
                <Text>{selectedFolder !== undefined ? selectedFolder.icon : '📁'}</Text>
              </Caption>
              <BodySm color={selectedFolder !== undefined ? 'primary' : 'tertiary'}>
                {selectedFolder !== undefined ? selectedFolder.name : 'No folder (save to root)'}
              </BodySm>
              <Caption color="tertiary">
                <Text>›</Text>
              </Caption>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── Waveform ─────────────────────────────────────── */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={[
            styles.waveformContainer,
            {
              backgroundColor: colors.bg.secondary,
              borderColor: colors.border.default,
            },
          ]}
        >
          <View style={styles.waveformBadge}>
            <Badge
              label={isRecording ? "Live Waveform" : "Ready to record"}
              variant={isRecording ? "primary" : "neutral"}
              size="sm"
            />
          </View>
          <LiveWaveform
            amplitudes={amplitudeList}
            isRecording={isRecording}
            isPaused={isPaused}
            width={W - spacing[5] * 2 - spacing[4] * 2}
            height={120}
          />
        </Animated.View>

        {/* ─── Timer ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeIn.delay(250).duration(500)}
          style={styles.timerSection}
        >
          <RecordingTimer
            duration={duration}
            isRecording={isRecording}
            isPaused={isPaused}
          />
        </Animated.View>

        {/* ─── Controls ─────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.controlsSection}
        >
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            isDisabled={recorderState === RecorderState.PREPARING}
            onRecord={handleStart}
            onPause={() => { void pause(); }}
            onResume={() => { void resume(); }}
            onStop={handleStop}
            onDiscard={handleDiscard}
          />
        </Animated.View>

        {/* ─── Tips (when idle) ─────────────────────────────── */}
        {isIdle && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={styles.tipsSection}
          >
            {[
              { icon: '🤖', text: 'AI will auto-transcribe after recording' },
              { icon: '☁️', text: 'Saved securely to cloud storage' },
              { icon: '📁', text: 'Organize recordings in folders' },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.tipRow}>
                <Caption style={styles.tipIcon}>
                  <Text>{icon}</Text>
                </Caption>
                <Caption color="tertiary">
                  <Text>{text}</Text>
                </Caption>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: spacing[12] }} />
      </ScrollView>

      {/* ─── Folder Picker (simple) ──────────────────────────── */}
      {showFolderPicker && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.bg.overlay,
              justifyContent:  'flex-end',
            },
          ]}
        >
          <View
            style={[
              styles.folderPickerSheet,
              {
                backgroundColor: colors.bg.modal,
                borderTopLeftRadius:  borderRadius['3xl'],
                borderTopRightRadius: borderRadius['3xl'],
              },
            ]}
          >
            <View style={styles.sheetHandle}>
              <View
                style={[styles.handle, { backgroundColor: colors.border.default }]}
              />
            </View>

            <H4 color="primary" style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
              <Text>Select Folder</Text>
            </H4>

            {/* None option */}
            <TouchableOpacity
              onPress={() => { setFolder(null); setShowFolderPicker(false); }}
              style={[
                styles.folderOption,
                {
                  borderBottomColor: colors.border.default,
                  backgroundColor:   folderId === null
                    ? colors.primary.muted
                    : 'transparent',
                },
              ]}
            >
              <Caption style={styles.folderOptionIcon}>
                <Text>📁</Text>
              </Caption>
              <BodySm color={folderId === null ? 'link' : 'primary'}>
                <Text>No folder (root)</Text>
              </BodySm>
              {folderId === null && (
                <Caption style={{ color: colors.primary.default }}>
                  <Text>✓</Text>
                </Caption>
              )}
            </TouchableOpacity>

            {/* Folder list */}
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder._id}
                onPress={() => { setFolder(folder._id); setShowFolderPicker(false); }}
                style={[
                  styles.folderOption,
                  {
                    borderBottomColor: colors.border.default,
                    backgroundColor:   folderId === folder._id
                      ? colors.primary.muted
                      : 'transparent',
                  },
                ]}
              >
                <Caption style={[styles.folderOptionIcon, { color: folder.color }]}>
                  <Text>{folder.icon || '📁'}</Text>
                </Caption>
                <BodySm color={folderId === folder._id ? 'link' : 'primary'}>
                  {folder.name}
                </BodySm>
                <Caption color="tertiary">{folder.recordingCount}</Caption>
                {folderId === folder._id && (
                  <Caption style={{ color: colors.primary.default }}>
                    <Text>✓</Text>
                  </Caption>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowFolderPicker(false)}
              style={[styles.cancelBtn, { margin: spacing[5] }]}
            >
              <BodySm color="secondary" align="center">
                <Text>Cancel</Text>
              </BodySm>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cancelBtn: {
    borderRadius: 12,
    padding:      14,
  } as ViewStyle,
  controlsSection: {
    alignItems:   'center',
    marginBottom: 24,
  } as ViewStyle,
  doneActions: {
    gap:   10,
    width: '100%',
  } as ViewStyle,
  doneBtn: {
    alignItems:     'center',
    borderRadius:   16,
    height:         52,
    justifyContent: 'center',
  } as ViewStyle,
  doneBtnText: {
    fontWeight: '600'
  },
  doneCard: {
    marginTop: 16,
    width: '100%'
  },
  doneContainer: {
    alignItems:        'center',
    flex:              1,
    gap:               12,
    justifyContent:    'center',
    padding:           32,
  } as ViewStyle,
  doneIcon: {
    alignItems:      'center',
    borderRadius:    30,
    height:          100,
    justifyContent:  'center',
    marginBottom:    8,
    width:           100,
  } as ViewStyle,
  doneIconText: {
    fontSize: 56
  },
  doneStatRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  folderIcon: {
    fontSize: 16
  },
  folderOption: {
    alignItems:      'center',
    borderBottomWidth: 1,
    flexDirection:   'row',
    gap:             12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  } as ViewStyle,
  folderOptionIcon: {
    fontSize: 20
  },
  folderPickerSheet: {
    maxHeight:     '70%',
    paddingBottom: 34,
  } as ViewStyle,
  folderSelector: {
    alignItems:      'center',
    borderWidth:     1,
    flexDirection:   'row',
    gap:             10,
    marginBottom:    20,
    padding:         14,
  } as ViewStyle,
  handle: {
    borderRadius: 2,
    height:       4,
    width:        40,
  } as ViewStyle,
  header: {
    alignItems:     'center',
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   8,
    paddingVertical: 12,
  } as ViewStyle,
  progressText: {
  },
  recordAnotherBtn: {
    alignItems:     'center',
    backgroundColor: 'transparent',
    borderRadius:   16,
    borderWidth: 1,
    height:         52,
    justifyContent: 'center',
  },
  recordAnotherText: {
    fontWeight: '600'
  },
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1 } as ViewStyle,
  sheetHandle: {
    alignItems:     'center',
    paddingVertical: 12,
  } as ViewStyle,
  timerSection: {
    alignItems:   'center',
    marginBottom: 32,
  } as ViewStyle,
  tipIcon: {
    fontSize: 16
  },
  tipRow: {
    alignItems:    'center',
    flexDirection: 'row',
    gap:           10,
  } as ViewStyle,
  tipsSection: {
    gap: 8,
    marginTop: 24,
  },
  titleInput: {
    borderWidth:  1,
    marginBottom: 12,
    padding:      14,
  } as ViewStyle,
  titleLabel: {
    marginBottom: 4
  },
  titleTextInput: {
    fontSize: 16,
    padding:  0,
  },
  uploadFill: {
    height: '100%',
  } as ViewStyle,
  uploadTitle: {
  },
  uploadTrack: {
    height: 6,
    overflow: 'hidden',
    width:  '100%',
  } as ViewStyle,
  uploadingContainer: {
    alignItems:     'center',
    flex:           1,
    gap:            8,
    justifyContent: 'center',
    padding:        32,
  } as ViewStyle,
  waveformBadge: {
    marginBottom: 12
  },
  waveformContainer: {
    alignItems:   'center',
    borderRadius:    32,
    borderWidth: 1,
    elevation: 4,
    marginBottom: 32,
    padding:      24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  } as ViewStyle,
});

export { RecordScreen };