import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { WaveformView }   from '@components/recording/WaveformView';
import { Badge }          from '@components/common/Badge';
import { Card }           from '@components/common/Card';
import { Loader }         from '@components/common/Loader';
import { Divider }        from '@components/common/Divider';
import {
  H3, H4, H5, BodyMd, BodySm, Caption, Label, MonoText,
} from '@components/common/Typography';
import useTheme           from '@hooks/useTheme';
import useRecordings      from '../hooks/useRecordings';
import usePlayer          from '@features/player/hooks/usePlayer';
import {
  fetchRecordingByIdThunk,
  selectSelectedRec,
  clearSelectedRecording,
} from '../store/recordingSlice';
import useAppDispatch     from '@hooks/useAppDispatch';
import useAppSelector     from '@hooks/useAppSelector';
import {
  formatDuration,
  formatFileSize,
  AIStatus,
} from '@types/recording.types';
import { generateShareLinkApi } from '../services/recording.api';
import type { RecordingsScreenProps } from '@navigation/types';

const { width: W } = Dimensions.get('window');

type Props = RecordingsScreenProps<'RecordingDetail'>;

// ─── Tab type ─────────────────────────────────────────────────────
type DetailTab = 'info' | 'ai' | 'notes';

const RecordingDetailScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { recordingId } = route.params;
  const { colors, spacing, borderRadius } = useTheme();
  const dispatch   = useAppDispatch();
  const recording  = useAppSelector(selectSelectedRec);
  const { play }   = usePlayer();
  const { toggleFavorite, deleteRecording } = useRecordings();

  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    void dispatch(fetchRecordingByIdThunk(recordingId));
    return () => { dispatch(clearSelectedRecording()); };
  }, [recordingId, dispatch]);

  if (!recording) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.primary }]}>
        <Loader fullScreen variant="pulse" label="Loading recording..." />
      </View>
    );
  }

  const date = new Date(recording.recordedAt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handleShare = async (): Promise<void> => {
    setIsSharing(true);
    try {
      const result = await generateShareLinkApi(recordingId, 24);
      await Share.share({
        message: `Listen to "${recording.title}" on AI Voice Recorder: ${result.shareUrl}`,
        url:     result.shareUrl,
      });
    } catch {
      Alert.alert('Share failed', 'Could not generate share link.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = (): void => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteRecording(recordingId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'info',  label: '📋 Info'  },
    { id: 'ai',    label: '🤖 AI'    },
    { id: 'notes', label: '📝 Notes' },
  ];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Nav Bar ─────────────────────────────────────── */}
        <View
          style={[styles.navbar, { paddingHorizontal: spacing[5] }]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.navBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption color="secondary">←</Caption>
          </TouchableOpacity>

          <H5 color="primary" numberOfLines={1} style={{ flex: 1, textAlign: 'center', marginHorizontal: 12 }}>
            {recording.title}
          </H5>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => toggleFavorite(recordingId)}
              style={[styles.navBtn, { backgroundColor: colors.bg.elevated }]}
            >
              <Caption style={{ fontSize: 16 }}>
                {recording.isFavorite ? '💛' : '🤍'}
              </Caption>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.navBtn, { backgroundColor: colors.error.surface }]}
            >
              <Caption style={{ color: colors.error.text, fontSize: 14 }}>🗑</Caption>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Waveform Hero ───────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={[styles.waveformSection, { backgroundColor: colors.bg.secondary }]}
        >
          <WaveformView
            waveform={recording.waveform}
            width={W - 40}
            height={80}
            barWidth={3}
            barGap={2}
            activeColor={colors.primary.default}
            inactiveColor={`${colors.primary.default}25`}
          />

          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <MonoText style={{ color: colors.primary.default, fontSize: 20, fontWeight: '700' }}>
              {formatDuration(recording.duration)}
            </MonoText>
          </View>
        </Animated.View>

        {/* ─── Action Buttons ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.actions, { paddingHorizontal: spacing[5] }]}
        >
          {/* Play */}
          <TouchableOpacity
            onPress={() => play(recording)}
            style={[styles.actionBtn, styles.playActionBtn, { backgroundColor: colors.primary.default }]}
          >
            <Caption style={{ color: '#fff', fontSize: 20 }}>▶</Caption>
            <Caption style={{ color: '#fff' }}>Play</Caption>
          </TouchableOpacity>

          {/* AI */}
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('AIScreen' as never, { recordingId } as never)}
            style={[styles.actionBtn, { backgroundColor: colors.ai.surface }]}
          >
            <Caption style={{ fontSize: 18 }}>🤖</Caption>
            <Caption style={{ color: colors.ai.default }}>AI</Caption>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={[styles.actionBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption style={{ fontSize: 18 }}>
              {isSharing ? '⟳' : '↗'}
            </Caption>
            <Caption color="secondary">Share</Caption>
          </TouchableOpacity>

          {/* Download — Phase 9 mein */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption style={{ fontSize: 18 }}>⬇</Caption>
            <Caption color="secondary">Save</Caption>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Detail Tabs ─────────────────────────────────── */}
        <View style={[styles.tabs, { paddingHorizontal: spacing[5] }]}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                {
                  borderBottomColor: activeTab === tab.id
                    ? colors.primary.default
                    : 'transparent',
                },
              ]}
            >
              <BodySm
                style={{
                  color: activeTab === tab.id
                    ? colors.primary.light
                    : colors.text.secondary,
                  fontWeight: activeTab === tab.id ? '600' : '400',
                }}
              >
                {tab.label}
              </BodySm>
            </TouchableOpacity>
          ))}
        </View>

        <Divider style={{ marginHorizontal: spacing[5] }} />

        {/* ─── Tab Content ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
          {activeTab === 'info' && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ gap: spacing[4] }}>
              {/* Metadata */}
              <Card variant="filled">
                <View style={{ gap: spacing[3] }}>
                  <H5 color="primary">File Info</H5>
                  {[
                    { label: 'Format',      value: recording.format.toUpperCase() },
                    { label: 'Quality',     value: recording.quality },
                    { label: 'File Size',   value: formatFileSize(recording.fileSize) },
                    { label: 'Sample Rate', value: `${recording.sampleRate} Hz` },
                    { label: 'Channels',    value: recording.channels === 1 ? 'Mono' : 'Stereo' },
                    { label: 'Bit Rate',    value: `${recording.bitrate} kbps` },
                    { label: 'Recorded',    value: date },
                    { label: 'Plays',       value: String(recording.playCount) },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.infoRow}>
                      <Caption color="tertiary">{label}</Caption>
                      <BodySm color="secondary">{value}</BodySm>
                    </View>
                  ))}
                </View>
              </Card>

              {/* Tags */}
              {recording.tags.length > 0 && (
                <View style={{ gap: spacing[2] }}>
                  <H5 color="primary">Tags</H5>
                  <View style={styles.tags}>
                    {recording.tags.map((tag) => (
                      <Badge key={tag} label={tag} variant="neutral" size="md" />
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {activeTab === 'ai' && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ gap: spacing[4] }}>
              {/* Transcription Status */}
              <Card variant="filled">
                <View style={{ gap: spacing[3] }}>
                  <View style={styles.aiStatusRow}>
                    <H5 color="primary">Transcription</H5>
                    <Badge
                      label={recording.ai.transcriptionStatus}
                      variant={
                        recording.ai.transcriptionStatus === AIStatus.COMPLETED
                          ? 'success'
                          : recording.ai.transcriptionStatus === AIStatus.FAILED
                          ? 'error'
                          : recording.ai.transcriptionStatus === AIStatus.PROCESSING
                          ? 'primary'
                          : 'neutral'
                      }
                      size="sm"
                    />
                  </View>

                  {recording.ai.transcriptionStatus === AIStatus.NONE && (
                    <BodySm color="secondary">
                      Transcription not started. Open the AI panel to process this recording.
                    </BodySm>
                  )}
                  {recording.ai.transcriptionStatus === AIStatus.COMPLETED && (
                    <>
                      <BodySm color="secondary">
                        Detected language: {recording.ai.language.toUpperCase()}
                      </BodySm>
                      {recording.ai.confidence != null && (
                        <BodySm color="secondary">
                          Confidence: {Math.round(recording.ai.confidence * 100)}%
                        </BodySm>
                      )}
                    </>
                  )}
                </View>
              </Card>

              {/* Open AI Panel CTA */}
              <TouchableOpacity
                onPress={() =>
                  navigation.getParent()?.navigate('AIScreen' as never, { recordingId } as never)
                }
                style={[
                  styles.aiCta,
                  {
                    backgroundColor: colors.ai.surface,
                    borderColor:     `${colors.ai.default}30`,
                  },
                ]}
              >
                <Caption style={{ fontSize: 28 }}>🤖</Caption>
                <View style={{ flex: 1 }}>
                  <H5 style={{ color: colors.ai.default }}>Open AI Panel</H5>
                  <BodySm color="secondary">
                    Transcribe, summarize, translate, and chat with this recording
                  </BodySm>
                </View>
                <Caption color="secondary">→</Caption>
              </TouchableOpacity>
            </Animated.View>
          )}

          {activeTab === 'notes' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card variant="filled">
                <BodySm color="secondary">
                  Notes will appear here after AI processing.{'\n'}
                  Open the AI panel to generate and edit notes.
                </BodySm>
              </Card>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 } as ViewStyle,
  navbar: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 12,
  } as ViewStyle,
  navBtn: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  waveformSection: {
    paddingHorizontal: 20,
    paddingVertical:   24,
    alignItems:        'center',
    gap:               16,
  } as ViewStyle,
  durationBadge: {
    alignItems: 'center',
  } as ViewStyle,
  actions: {
    flexDirection:  'row',
    gap:            10,
    paddingVertical: 16,
  } as ViewStyle,
  actionBtn: {
    flex:           1,
    height:         64,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
  } as ViewStyle,
  playActionBtn: {
    flex: 1.5,
  } as ViewStyle,
  tabs: {
    flexDirection:  'row',
    marginTop:      8,
    gap:            4,
  } as ViewStyle,
  tab: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
  } as ViewStyle,
  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  } as ViewStyle,
  tags: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  } as ViewStyle,
  aiStatusRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  } as ViewStyle,
  aiCta: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    borderRadius:    16,
    borderWidth:     1,
    gap:             12,
  } as ViewStyle,
});

export { RecordingDetailScreen };