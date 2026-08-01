import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
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
  H4, BodySm, Caption, Label,
} from '@components/common/Typography';
import { Card }    from '@components/common/Card';
import { Badge }   from '@components/common/Badge';
import { Loader }  from '@components/common/Loader';
import useTheme    from '@hooks/useTheme';
import useRecorder from '../hooks/useRecorder';
import { RecorderState } from '../store/recorderSlice';
import { selectFolders }  from '@features/folder/store/folderSlice';
import useAppSelector     from '@hooks/useAppSelector';
import {
  formatDuration,
  formatFileSize,
} from '@types/recording.types';

const { width: W } = Dimensions.get('window');

// ─── Upload Progress Screen ───────────────────────────────────────
const UploadingView = ({
  progress,
  title,
}: {
  progress: number;
  title:    string;
}): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withSpring(progress / 100, { damping: 20, stiffness: 100 });
  }, [fillWidth, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  return (
    <View style={[styles.uploadingContainer]}>
      <Loader variant="ai" color={colors.primary.default} size="lg" />

      <H4 color="primary" align="center" style={{ marginTop: spacing[4] }}>
        Uploading to Cloud
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

      <Caption color="secondary" style={{ marginTop: spacing[2] }}>
        {progress}% uploaded
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
  recording:       NonNullable<ReturnType<typeof useRecorder>['uploadedRecording']>;
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
        <Caption style={{ fontSize: 56 }}>✅</Caption>
      </View>

      <H4 color="primary" align="center">Recording Saved!</H4>
      <BodySm color="secondary" align="center">
        {recording.title}
      </BodySm>

      {/* Stats */}
      <Card variant="outlined" style={{ width: '100%', marginTop: spacing[4] }}>
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
          <BodySm style={{ color: '#fff', fontWeight: '600' }}>
            View Recording
          </BodySm>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRecordAnother}
          style={[
            styles.doneBtn,
            {
              backgroundColor: colors.bg.elevated,
              borderColor:     colors.border.default,
              borderWidth:     1,
            },
          ]}
        >
          <BodySm color="secondary" style={{ fontWeight: '600' }}>
            Record Another
          </BodySm>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Record Screen ────────────────────────────────────────────────
const RecordScreen = ({ navigation }: { navigation: any }): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const folders = useAppSelector(selectFolders);
  const titleRef = useRef<TextInput>(null);

  const {
    recorderState, duration, amplitudeList, currentAmplitude,
    title, folderId, uploadProgress, uploadedRecording, error,
    isRecording, isPaused, isUploading, isDone, isIdle,
    start, pause, resume, stop, discard, reset, setTitle, setFolder,
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
    navigation.getParent()?.navigate('RecordingsTab', {
      screen: 'RecordingDetail',
      params: { recordingId: uploadedRecording._id },
    });
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
          <H4 color="primary">New Recording</H4>
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
              <Caption color="tertiary" style={{ marginBottom: 4 }}>Title (optional)</Caption>
              <TextInput
                ref={titleRef}
                value={localTitle}
                onChangeText={setLocalTitle}
                placeholder="e.g. Team Meeting Notes"
                placeholderTextColor={colors.text.tertiary}
                style={{
                  color:    colors.text.primary,
                  fontSize: 16,
                  padding:  0,
                }}
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
              <Caption style={{ fontSize: 16 }}>
                {selectedFolder ? selectedFolder.icon : '📁'}
              </Caption>
              <BodySm color={selectedFolder ? 'primary' : 'tertiary'}>
                {selectedFolder ? selectedFolder.name : 'No folder (save to root)'}
              </BodySm>
              <Caption color="tertiary">›</Caption>
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
              borderRadius:    borderRadius['2xl'],
            },
          ]}
        >
          <LiveWaveform
            amplitudes={amplitudeList}
            currentAmplitude={currentAmplitude}
            isRecording={isRecording}
            isPaused={isPaused}
            width={W - spacing[5] * 2 - spacing[4] * 2}
            height={100}
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
            isIdle={isIdle}
            isDisabled={recorderState === RecorderState.PREPARING}
            onRecord={handleStart}
            onPause={() => void pause()}
            onResume={() => void resume()}
            onStop={handleStop}
            onDiscard={handleDiscard}
          />
        </Animated.View>

        {/* ─── Tips (when idle) ─────────────────────────────── */}
        {isIdle && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={{ marginTop: spacing[6], gap: spacing[2] }}
          >
            {[
              { icon: '🤖', text: 'AI will auto-transcribe after recording' },
              { icon: '☁️', text: 'Saved securely to cloud storage' },
              { icon: '📁', text: 'Organize recordings in folders' },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.tipRow}>
                <Caption style={{ fontSize: 16 }}>{icon}</Caption>
                <Caption color="tertiary">{text}</Caption>
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
              Select Folder
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
              <Caption style={{ fontSize: 20 }}>📁</Caption>
              <BodySm color={folderId === null ? 'link' : 'primary'}>
                No folder (root)
              </BodySm>
              {folderId === null && <Caption style={{ color: colors.primary.default }}>✓</Caption>}
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
                <Caption style={{ fontSize: 20, color: folder.color }}>
                  {folder.icon || '📁'}
                </Caption>
                <BodySm color={folderId === folder._id ? 'link' : 'primary'}>
                  {folder.name}
                </BodySm>
                <Caption color="tertiary">{folder.recordingCount}</Caption>
                {folderId === folder._id && (
                  <Caption style={{ color: colors.primary.default }}>✓</Caption>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowFolderPicker(false)}
              style={[styles.cancelBtn, { margin: spacing[5] }]}
            >
              <BodySm color="secondary" align="center">Cancel</BodySm>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1 } as ViewStyle,
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom:   8,
  } as ViewStyle,
  titleInput: {
    padding:      14,
    borderWidth:  1,
    marginBottom: 12,
  } as ViewStyle,
  folderSelector: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         14,
    borderWidth:     1,
    gap:             10,
    marginBottom:    20,
  } as ViewStyle,
  waveformContainer: {
    padding:      20,
    alignItems:   'center',
    marginBottom: 24,
  } as ViewStyle,
  timerSection: {
    alignItems:   'center',
    marginBottom: 32,
  } as ViewStyle,
  controlsSection: {
    alignItems:   'center',
    marginBottom: 24,
  } as ViewStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  } as ViewStyle,
  uploadingContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        32,
    gap:            8,
  } as ViewStyle,
  uploadTrack: {
    width:  '100%',
    height: 6,
    overflow: 'hidden',
  } as ViewStyle,
  uploadFill: {
    height: '100%',
  } as ViewStyle,
  doneContainer: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    padding:           32,
    gap:               12,
  } as ViewStyle,
  doneIcon: {
    width:           100,
    height:          100,
    borderRadius:    30,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    8,
  } as ViewStyle,
  doneStatRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  doneActions: {
    width: '100%',
    gap:   10,
  } as ViewStyle,
  doneBtn: {
    height:         52,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  folderPickerSheet: {
    maxHeight:     '70%',
    paddingBottom: 34,
  } as ViewStyle,
  sheetHandle: {
    alignItems:     'center',
    paddingVertical: 12,
  } as ViewStyle,
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
  } as ViewStyle,
  folderOption: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap:             12,
  } as ViewStyle,
  cancelBtn: {
    padding:      14,
    borderRadius: 12,
  } as ViewStyle,
});

export { RecordScreen };