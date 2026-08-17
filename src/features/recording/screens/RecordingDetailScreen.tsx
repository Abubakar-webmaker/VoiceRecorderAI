/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals, @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  Text,
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
  H5, BodySm, Caption, MonoText,
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
} from '@shared/types/recording.types';
import { generateShareLinkApi } from '../services/recording.api';
import type { RecordingsScreenProps } from '@navigation/types';

const { width: W } = Dimensions.get('window');

type Props = RecordingsScreenProps<'RecordingDetail'>;

// ─── Tab type ─────────────────────────────────────────────────────
type DetailTab = 'info' | 'ai' | 'notes';

const RecordingDetailScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { recordingId } = route.params;
  const { colors, spacing } = useTheme();
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
        contentContainerStyle={styles.scrollContent}
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
            <Caption color="secondary"><Text>←</Text></Caption>
          </TouchableOpacity>

          <H5 color="primary" numberOfLines={1} style={styles.navTitle}>
            {recording.title}
          </H5>

          <View style={styles.navActions}>
            <TouchableOpacity
              onPress={() => { void toggleFavorite(recordingId); }}
              style={[styles.navBtn, { backgroundColor: colors.bg.elevated }]}
            >
              <Caption style={styles.favIcon}>
                <Text>{recording.isFavorite ? '💛' : '🤍'}</Text>
              </Caption>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.navBtn, { backgroundColor: colors.error.surface }]}
            >
              <Caption style={[styles.deleteIcon, { color: colors.error.text }]}><Text>🗑</Text></Caption>
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
            <MonoText style={[styles.durationText, { color: colors.primary.default }]}>
              {formatDuration(recording.duration)}
            </MonoText>
          </View>
        </Animated.View>

        {/* ─── Action Buttons ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.actions, { paddingHorizontal: spacing[5] }]}
        >
        <TouchableOpacity
          onPress={() => { void play(recording); }}
          style={[styles.actionBtn, styles.playActionBtn, { backgroundColor: colors.primary.default }]}
        >
          <Caption style={styles.actionIcon}>
            <Text>▶</Text>
          </Caption>
          <Caption style={[styles.whiteText, { color: colors.text.inverse }]}>
            <Text>Play</Text>
          </Caption>
        </TouchableOpacity>

          {/* AI */}
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('AIScreen' as never, { recordingId } as never)}
            style={[styles.actionBtn, { backgroundColor: colors.ai.surface }]}
          >
            <Caption style={styles.actionIconSm}><Text>🤖</Text></Caption>
            <Caption style={{ color: colors.ai.default }}><Text>AI</Text></Caption>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={() => { void handleShare(); }}
            disabled={isSharing}
            style={[styles.actionBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption style={styles.actionIconSm}>
              <Text>{isSharing ? '⟳' : '↗'}</Text>
            </Caption>
            <Caption color="secondary"><Text>Share</Text></Caption>
          </TouchableOpacity>

          {/* Download — Phase 9 mein */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption style={styles.actionIconSm}><Text>⬇</Text></Caption>
            <Caption color="secondary"><Text>Save</Text></Caption>
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
                style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? colors.primary.light : colors.text.secondary },
                  activeTab === tab.id ? styles.fontWeight600 : styles.fontWeight400
                ]}
              >
                <Text>{tab.label}</Text>
              </BodySm>
            </TouchableOpacity>
          ))}
        </View>

        <Divider style={{ marginHorizontal: spacing[5] }} />

        {/* ─── Tab Content ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
          {activeTab === 'info' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContentGap}>
              {/* Metadata */}
              <Card variant="filled">
                <View style={styles.cardContent}>
                  <H5 color="primary">
                    <Text>File Info</Text>
                  </H5>
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
                      <Caption color="tertiary">
                        <Text>{label}</Text>
                      </Caption>
                      <BodySm color="secondary">
                        <Text>{value}</Text>
                      </BodySm>
                    </View>
                  ))}
                </View>
              </Card>

              {/* Tags */}
              {recording.tags.length > 0 && (
                <View style={styles.cardContentSmall}>
                  <H5 color="primary">
                    <Text>Tags</Text>
                  </H5>
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
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContentGap}>
              {/* Transcription Status */}
              <Card variant="filled">
                <View style={styles.cardContent}>
                  <View style={styles.aiStatusRow}>
                    <H5 color="primary">
                      <Text>Transcription</Text>
                    </H5>
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
                      <Text>Transcription not started. Open the AI panel to process this recording.</Text>
                    </BodySm>
                  )}
                  {recording.ai.transcriptionStatus === AIStatus.COMPLETED && (
                    <>
                      <BodySm color="secondary">
                        <Text>Detected language: {recording.ai.language.toUpperCase()}</Text>
                      </BodySm>
                      {recording.ai.confidence !== undefined && recording.ai.confidence !== null && (
                        <BodySm color="secondary">
                          <Text>Confidence: {Math.round(recording.ai.confidence * 100)}%</Text>
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
                <Caption style={styles.actionIconLg}><Text>🤖</Text></Caption>
                <View style={styles.flex1}>
                  <H5 style={{ color: colors.ai.default }}><Text>Open AI Panel</Text></H5>
                  <BodySm color="secondary">
                    <Text>Transcribe, summarize, translate, and chat with this recording</Text>
                  </BodySm>
                </View>
                <Caption color="secondary"><Text>→</Text></Caption>
              </TouchableOpacity>
            </Animated.View>
          )}

          {activeTab === 'notes' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card variant="filled">
                <BodySm color="secondary">
                  <Text>Notes will appear here after AI processing.{"\n"}</Text>
                  <Text>Open the AI panel to generate and edit notes.</Text>
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
  actionBtn: {
    flex:           1,
    height:         64,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
  } as ViewStyle,
  actionIcon: {
    fontSize: 20
  },
  actionIconLg: {
    fontSize: 28
  },
  actionIconSm: {
    fontSize: 18
  },
  actions: {
    flexDirection:  'row',
    gap:            10,
    paddingVertical: 16,
  } as ViewStyle,
  aiCta: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    borderRadius:    16,
    borderWidth:     1,
    gap:             12,
  } as ViewStyle,
  aiStatusRow: {
    alignItems:     'center',
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  cardContent: {
    gap: 12
  },
  cardContentSmall: {
    gap: 8
  },
  deleteIcon: {
    fontSize: 14
  },
  durationBadge: {
    alignItems: 'center',
  } as ViewStyle,
  durationText: {
    fontSize: 20,
    fontWeight: '700'
  },
  favIcon: {
    fontSize: 16
  },
  flex1: {
    flex: 1
  },
  fontWeight400: {
    fontWeight: '400'
  },
  fontWeight600: {
    fontWeight: '600'
  },
  infoRow: {
    alignItems:     'center',
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  navActions: {
    flexDirection: 'row',
    gap: 8
  },
  navBtn: {
    alignItems:     'center',
    borderRadius:   12,
    height:         40,
    justifyContent: 'center',
    width:          40,
  } as ViewStyle,
  navTitle: {
    flex: 1,
    marginHorizontal: 12,
    textAlign: 'center'
  },
  navbar: {
    alignItems:     'center',
    flexDirection:  'row',
    paddingVertical: 12,
  } as ViewStyle,
  playActionBtn: {
    flex: 1.5,
  } as ViewStyle,
  screen: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingBottom: 40
  },
  tab: {
    alignItems:      'center',
    borderBottomWidth: 2,
    flex:            1,
    paddingVertical: 10,
  } as ViewStyle,
  tabContentGap: {
    gap: 16
  },
  tabText: {
    // colors handled inline
  },
  tabs: {
    flexDirection:  'row',
    gap:            4,
    marginTop:      8,
  } as ViewStyle,
  tags: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  } as ViewStyle,
  waveformSection: {
    alignItems:        'center',
    gap:               16,
    paddingHorizontal: 20,
    paddingVertical:   24,
  } as ViewStyle,
  whiteText: {
  }
});

export { RecordingDetailScreen };
