/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals, @typescript-eslint/explicit-function-return-type */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TranscriptionView } from '../components/TranscriptionView';
import { AIChatView }        from '../components/AIChatView';
import {
  H4, H5, BodySm, Caption, Label,
} from '@components/common/Typography';
import { Badge }    from '@components/common/Badge';
import { Card }     from '@components/common/Card';
import { Loader }   from '@components/common/Loader';
import { Button }   from '@components/common/Button';
import useTheme     from '@hooks/useTheme';
import useAppDispatch from '@hooks/useAppDispatch';
import useAppSelector from '@hooks/useAppSelector';
import {
  fetchAISummaryThunk,
  transcribeThunk,
  summarizeThunk,
  extractKeywordsThunk,
  extractActionItemsThunk,
  processAllThunk,
  chatThunk,
  toggleActionItemOptimistic,
  updateActionItemThunk,
  setCurrentRecording,
  selectCurrentAISummary,
  selectIsTranscribing,
  selectIsSummarizing,
  selectIsProcessingAll,
  selectIsExtractingKw,
  selectIsExtractingAct,
  selectAIError,
  selectIsLoadingSummary,
  selectCurrentChat,
  selectIsChatLoading,
  clearAIError,
} from '../store/aiSlice';
import { AIStatus }     from '@shared/types/recording.types';
import type { AISummaryDoc, AIActionItem, AIKeyword } from '@shared/types/ai.types';
import type { RootScreenProps } from '@navigation/types';

// ─── AI Tab types ─────────────────────────────────────────────────
type AITab = 'overview' | 'transcript' | 'summary' | 'actions' | 'chat';

const AI_TABS: { id: AITab; label: string; icon: string }[] = [
  { id: 'overview',    label: 'Overview',    icon: '🧠' },
  { id: 'transcript',  label: 'Transcript',  icon: '📝' },
  { id: 'summary',     label: 'Summary',     icon: '📋' },
  { id: 'actions',     label: 'Actions',     icon: '✅' },
  { id: 'chat',        label: 'Chat',        icon: '💬' },
];

// ─── Status Badge Helper ──────────────────────────────────────────
const AIStatusBadge = ({ status }: { status: AIStatus }): React.JSX.Element => {
  const variant =
    status === AIStatus.COMPLETED  ? 'success'  :
    status === AIStatus.PROCESSING ? 'primary'  :
    status === AIStatus.FAILED     ? 'error'    :
    status === AIStatus.PENDING    ? 'warning'  : 'neutral';

  return <Badge label={status} variant={variant} size="sm" />;
};

// ─── Overview Tab ─────────────────────────────────────────────────
interface OverviewProps {
  recordingId:     string;
  summary:         AISummaryDoc;
  isTranscribing:  boolean;
  isSummarizing:   boolean;
  isProcessingAll: boolean;
  isExtractingKw:  boolean;
  isExtractingAct: boolean;
  onProcessAll:    () => void;
  onTranscribe:    () => void;
  onSummarize:     () => void;
  onKeywords:      () => void;
  onActions:       () => void;
}

const OverviewTab = ({
  summary,
  isTranscribing, isSummarizing, isProcessingAll,
  isExtractingKw, isExtractingAct,
  onProcessAll, onTranscribe, onSummarize, onKeywords, onActions,
}: OverviewProps): React.JSX.Element => {
  const { colors, spacing } = useTheme();

  const hasTranscription = summary.transcription.status === AIStatus.COMPLETED;
  const hasSummary       = summary.summary.status       === AIStatus.COMPLETED;
  const hasKeywords      = summary.keywords.status      === AIStatus.COMPLETED;
  const hasActions       = summary.actionItems.status   === AIStatus.COMPLETED;

  const rows = [
    {
      label:   'Transcription',
      icon:    '🎙',
      status:  summary.transcription.status,
      onPress: onTranscribe,
      loading: isTranscribing,
      info:    hasTranscription
        ? `${summary.transcription.wordCount} words · ${summary.transcription.languageName}`
        : 'Not started',
    },
    {
      label:   'Summary',
      icon:    '📋',
      status:  summary.summary.status,
      onPress: onSummarize,
      loading: isSummarizing,
      info:    hasSummary
        ? `${summary.summary.text.length} characters`
        : 'Requires transcription',
    },
    {
      label:   'Keywords',
      icon:    '🏷',
      status:  summary.keywords.status,
      onPress: onKeywords,
      loading: isExtractingKw,
      info:    hasKeywords
        ? `${summary.keywords.items.length} keywords found`
        : 'Requires transcription',
    },
    {
      label:   'Action Items',
      icon:    '✅',
      status:  summary.actionItems.status,
      onPress: onActions,
      loading: isExtractingAct,
      info:    hasActions
        ? `${summary.actionItems.items.length} items found`
        : 'Requires transcription',
    },
  ];

  return (
    <View style={{ gap: spacing[4] }}>
      {/* Process All CTA */}
      {!hasTranscription && (
        <Card variant="filled">
          <View style={[styles.ctaContent, { gap: spacing[3] }]}>
            <Caption style={styles.ctaIcon}>🤖</Caption>
            <H5 align="center" color="primary">
              AI Full Analysis
            </H5>
            <BodySm color="secondary" align="center">
              Transcribe, summarize, and extract keywords in one tap
            </BodySm>
            <Button
              label={isProcessingAll ? 'Processing...' : 'Run Full AI Analysis'}
              onPress={onProcessAll}
              variant="ai"
              size="md"
              fullWidth
              isLoading={isProcessingAll}
            />
          </View>
        </Card>
      )}

      {/* Status grid */}
      <View style={{ gap: spacing[2] }}>
        {rows.map(({ label, icon, status, onPress, loading, info }) => (
          <TouchableOpacity
            key={label}
            onPress={status === AIStatus.NONE ? onPress : undefined}
            disabled={status === AIStatus.PROCESSING || loading}
            style={[
              styles.statusRow,
              {
                backgroundColor: colors.bg.elevated,
                borderColor:     colors.border.default,
              },
            ]}
          >
            <Caption style={styles.rowIcon}>{icon}</Caption>
            <View style={styles.flex1}>
              <BodySm color="primary" style={styles.rowLabel}>{label}</BodySm>
              <Caption color="secondary">{info}</Caption>
            </View>
            {loading ? (
              <Loader size="sm" color={colors.primary.default} />
            ) : (
              <AIStatusBadge status={status} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Cost info */}
      {summary.totalTokensUsed > 0 && (
        <Caption color="tertiary" align="center">
          {summary.totalTokensUsed.toLocaleString()}
          <Text>{' tokens used · ~$'}</Text>
          {summary.totalCost.toFixed(4)}
          <Text>{' estimated cost'}</Text>
        </Caption>
      )}
    </View>
  );
};

// ─── Actions Tab ──────────────────────────────────────────────────
interface ActionsTabProps {
  items:      AIActionItem[];
  onToggle:   (id: string, completed: boolean) => void;
  onExtract:  () => void;
  isLoading:  boolean;
}

const ActionsTab = ({
  items,
  onToggle,
  onExtract,
  isLoading,
}: ActionsTabProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();

  if (items.length === 0) {
    return (
      <View style={{ gap: spacing[4] }}>
        <Card variant="outlined">
          <View style={[styles.emptyActions, { gap: spacing[3], padding: spacing[4] }]}>
            <Caption style={styles.emptyActionsIcon}>✅</Caption>
            <H5 align="center" color="primary">No action items yet</H5>
            <BodySm color="secondary" align="center">
              Extract action items from this recording transcript
            </BodySm>
            <Button
              label="Extract Action Items"
              onPress={onExtract}
              variant="ai"
              size="md"
              isLoading={isLoading}
            />
          </View>
        </Card>
      </View>
    );
  }

  const done    = items.filter((i) => i.completed).length;

  return (
    <View style={{ gap: spacing[3] }}>
      {/* Progress */}
      <View style={[styles.actionProgress, { gap: spacing[2] }]}>
        <Caption color="secondary">
          {done}
          <Text>/</Text>
          {items.length}
          <Text> completed</Text>
        </Caption>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.border.default, borderRadius: borderRadius.full },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width:           `${items.length > 0 ? (done / items.length) * 100 : 0}%`,
                backgroundColor: colors.ai.default,
                borderRadius:    borderRadius.full,
              },
            ]}
          />
        </View>
      </View>

      {/* Items */}
      {items.map((item) => (
        <TouchableOpacity
          key={item._id}
          onPress={() => onToggle(item._id, !item.completed)}
          style={[
            styles.actionItem,
            {
              backgroundColor: item.completed
                ? colors.ai.surface
                : colors.bg.elevated,
              borderColor: item.completed
                ? `${colors.ai.default}30`
                : colors.border.default,
            },
          ]}
        >
          {/* Checkbox */}
          <View
            style={[
              styles.checkbox,
              {
                borderColor:     item.completed ? colors.ai.default : colors.border.default,
                backgroundColor: item.completed ? colors.ai.default : 'transparent',
              },
            ]}
          >
            {item.completed && (
              <Caption style={[styles.checkIcon, { color: colors.text.inverse }]}>✓</Caption>
            )}
          </View>

          <View style={styles.actionItemContent}>
            <BodySm
              style={[
                styles.taskText,
                {
                  color:          item.completed ? colors.text.secondary : colors.text.primary,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                },
              ]}
            >
              {item.task}
            </BodySm>

            <View style={styles.actionMeta}>
              {item.assignee && (
                <Caption color="tertiary">
                  <Text>👤 </Text>
                  {item.assignee}
                </Caption>
              )}
              {item.deadline && (
                <Caption color="tertiary">
                  <Text>📅 </Text>
                  {item.deadline}
                </Caption>
              )}
              <Badge
                label={item.priority}
                variant={
                  item.priority === 'high'   ? 'error'   :
                  item.priority === 'medium' ? 'warning' : 'neutral'
                }
                size="sm"
              />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Main AI Screen ───────────────────────────────────────────────
type Props = RootScreenProps<'AIScreen'>;

const AIScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { recordingId } = route.params;
  const { colors, spacing } = useTheme();
  const dispatch = useAppDispatch();

  const summary        = useAppSelector((s) => selectCurrentAISummary(s, recordingId));
  const isLoadingSummary = useAppSelector(selectIsLoadingSummary);
  const isTranscribing = useAppSelector(selectIsTranscribing);
  const isSummarizing  = useAppSelector(selectIsSummarizing);
  const isProcessingAll = useAppSelector(selectIsProcessingAll);
  const isExtractingKw  = useAppSelector(selectIsExtractingKw);
  const isExtractingAct = useAppSelector(selectIsExtractingAct);
  const error          = useAppSelector(selectAIError);
  const currentChat    = useAppSelector(selectCurrentChat);
  const isChatLoading  = useAppSelector(selectIsChatLoading);

  const [activeTab, setActiveTab] = useState<AITab>('overview');

  // Load AI summary on mount
  useEffect(() => {
    dispatch(setCurrentRecording(recordingId));
    void dispatch(fetchAISummaryThunk(recordingId));
  }, [recordingId, dispatch]);

  // Handle error
  useEffect(() => {
    if (error) {
      Alert.alert('AI Error', error, [
        { text: 'OK', onPress: () => dispatch(clearAIError()) },
      ]);
    }
  }, [error, dispatch]);

  const handleProcessAll = useCallback((): void => {
    void dispatch(processAllThunk({
      recordingId,
      summaryLength:       'medium',
      generateTitle:       true,
      generateKeywords:    true,
      generateActionItems: false,
    }));
  }, [dispatch, recordingId]);

  const handleTranscribe = useCallback((): void => {
    void dispatch(transcribeThunk({ recordingId }));
  }, [dispatch, recordingId]);

  const handleSummarize = useCallback((): void => {
    void dispatch(summarizeThunk({ recordingId, length: 'medium' }));
  }, [dispatch, recordingId]);

  const handleKeywords = useCallback((): void => {
    void dispatch(extractKeywordsThunk({ recordingId }));
  }, [dispatch, recordingId]);

  const handleActionItems = useCallback((): void => {
    void dispatch(extractActionItemsThunk({ recordingId }));
  }, [dispatch, recordingId]);

  const handleToggleActionItem = useCallback(
    (itemId: string, completed: boolean): void => {
      dispatch(toggleActionItemOptimistic({ recordingId, itemId }));
      void dispatch(updateActionItemThunk({
        recordingId, actionItemId: itemId, updates: { completed },
      }));
    },
    [dispatch, recordingId],
  );

  const handleChat = useCallback(
    (message: string): void => {
      void dispatch(chatThunk({
        recordingId,
        chatId:  currentChat?._id,
        message,
      }));
    },
    [dispatch, recordingId, currentChat],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingHorizontal: spacing[5] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, { backgroundColor: colors.bg.elevated }]}
        >
          <Caption color="secondary">✕</Caption>
        </TouchableOpacity>

        <H4 color="primary">AI Analysis</H4>

        <View style={[styles.closeBtn, styles.invisible]} />
      </View>

      {/* ─── Tab Bar ──────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabBar,
          { paddingHorizontal: spacing[5] },
        ]}
      >
        {AI_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.id
                  ? colors.primary.muted
                  : colors.bg.elevated,
                borderColor: activeTab === tab.id
                  ? `${colors.primary.default}40`
                  : colors.border.default,
              },
            ]}
          >
            <Caption
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.id
                    ? colors.primary.light
                    : colors.text.secondary,
                },
                activeTab === tab.id ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              <Text>{tab.icon}</Text>
              <Text>{' '}</Text>
              <Text>{tab.label}</Text>
            </Caption>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── Content ──────────────────────────────────────────── */}
      {isLoadingSummary ? (
        <View style={styles.center}>
          <Loader variant="ai" label="Loading AI data..." />
        </View>
      ) : activeTab === 'chat' ? (
        // Chat has its own scroll + input
        <AIChatView
          messages={currentChat?.messages ?? []}
          isLoading={isChatLoading}
          onSend={handleChat}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: spacing[5] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview */}
          {activeTab === 'overview' && summary && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <OverviewTab
                recordingId={recordingId}
                summary={summary}
                isTranscribing={isTranscribing}
                isSummarizing={isSummarizing}
                isProcessingAll={isProcessingAll}
                isExtractingKw={isExtractingKw}
                isExtractingAct={isExtractingAct}
                onProcessAll={handleProcessAll}
                onTranscribe={handleTranscribe}
                onSummarize={handleSummarize}
                onKeywords={handleKeywords}
                onActions={handleActionItems}
              />
            </Animated.View>
          )}

          {/* Transcript */}
          {activeTab === 'transcript' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {summary.transcription.status === AIStatus.COMPLETED ? (
                  <TranscriptionView
                  fullText={summary.transcription.fullText}
                  segments={summary.transcription.segments}
                  _language={summary.transcription.language}
                  languageName={summary.transcription.languageName}
                  confidence={summary.transcription.confidence}
                  wordCount={summary.transcription.wordCount}
                />
              ) : (
                <Card variant="outlined">
                  <View style={[styles.emptyTranscript, { gap: spacing[3], padding: spacing[4] }]}>
                    <Caption style={styles.emptyTranscriptIcon}>🎙</Caption>
                    <H5 align="center" color="primary">No transcription yet</H5>
                    <BodySm color="secondary" align="center">
                      Transcribe this recording to see the full text with timestamps
                    </BodySm>
                    <Button
                      label="Transcribe Now"
                      onPress={handleTranscribe}
                      variant="primary"
                      size="md"
                      isLoading={isTranscribing}
                    />
                  </View>
                </Card>
              )}
            </Animated.View>
          )}

          {/* Summary */}
          {activeTab === 'summary' && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ gap: spacing[4] }}>
              {summary.summary.status === AIStatus.COMPLETED ? (
                <>
                  <Card variant="filled">
                    <View style={{ gap: spacing[2] }}>
                      <View style={styles.summaryHeader}>
                        <Label color="secondary">AI Summary</Label>
                        <Badge
                          label={summary.summary.length}
                          variant="neutral"
                          size="sm"
                        />
                      </View>
                      <BodySm color="primary" style={styles.summaryText}>
                        {summary.summary.text}
                      </BodySm>
                    </View>
                  </Card>

                  {/* AI Title */}
                  {summary.aiTitle.status === AIStatus.COMPLETED && (
                    <Card variant="outlined">
                      <View style={{ gap: spacing[1] }}>
                        <Label color="secondary">Suggested Title</Label>
                        <BodySm color="primary" style={styles.suggestedTitle}>
                          {summary.aiTitle.text}
                        </BodySm>
                      </View>
                    </Card>
                  )}

                  {/* Keywords */}
                  {summary.keywords.status === AIStatus.COMPLETED &&
                    summary.keywords.items.length > 0 && (
                    <View style={{ gap: spacing[2] }}>
                      <Label color="secondary">Keywords</Label>
                      <View style={styles.keywordGrid}>
                        {summary.keywords.items
                          .slice()
                          .sort((a: AIKeyword, b: AIKeyword) => b.relevance - a.relevance)
                          .map((kw: AIKeyword) => (
                          <View
                            key={kw.word}
                            style={[
                              styles.keyword,
                              {
                                backgroundColor: colors.primary.surface,
                                borderColor:     `${colors.primary.default}25`,
                              },
                            ]}
                          >
                            <Caption style={{ color: colors.primary.light }}>
                              {kw.word}
                            </Caption>
                            <Caption
                              style={[
                                styles.relevanceText,
                                { color: colors.text.tertiary },
                              ]}
                            >
                              {Math.round(kw.relevance * 100)}
                              <Text>%</Text>
                            </Caption>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Card variant="outlined">
                  <View style={[styles.emptySummary, { gap: spacing[3], padding: spacing[4] }]}>
                    <Caption style={styles.emptySummaryIcon}>📋</Caption>
                    <H5 align="center" color="primary">No summary yet</H5>
                    <BodySm color="secondary" align="center">
                      {summary.transcription.status === AIStatus.COMPLETED
                        ? 'Generate a summary of the transcript'
                        : 'Transcription required first'}
                    </BodySm>
                    <Button
                      label="Generate Summary"
                      onPress={handleSummarize}
                      variant="ai"
                      size="md"
                      isLoading={isSummarizing}
                      isDisabled={summary.transcription.status !== AIStatus.COMPLETED}
                    />
                  </View>
                </Card>
              )}
            </Animated.View>
          )}

          {/* Action Items */}
          {activeTab === 'actions' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <ActionsTab
                items={summary?.actionItems?.items ?? []}
                onToggle={handleToggleActionItem}
                onExtract={handleActionItems}
                isLoading={isExtractingAct}
              />
            </Animated.View>
          )}

          <View style={{ height: spacing[12] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionItem: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    padding:         14,
    borderRadius:    14,
    borderWidth:     1,
    gap:             12,
  } as ViewStyle,
  actionItemContent: {
    flex: 1,
    gap:  4,
  } as ViewStyle,
  actionMeta: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
    alignItems:    'center',
  } as ViewStyle,
  actionProgress: {
    gap: 6,
  } as ViewStyle,
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  checkIcon: {
    fontSize: 10,
  },
  checkbox: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      1,
  } as ViewStyle,
  closeBtn: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  content: {
    paddingTop:    12,
    paddingBottom: 40,
    gap:           16,
  } as ViewStyle,
  ctaContent: {
    alignItems: 'center',
  } as ViewStyle,
  ctaIcon: {
    fontSize: 40,
  } as ViewStyle,
  emptyActions: {
    alignItems: 'center',
  } as ViewStyle,
  emptyActionsIcon: {
    fontSize: 36,
  } as ViewStyle,
  emptySummary: {
    alignItems: 'center',
  } as ViewStyle,
  emptySummaryIcon: {
    fontSize: 36,
  } as ViewStyle,
  emptyTranscript: {
    alignItems: 'center',
  } as ViewStyle,
  emptyTranscriptIcon: {
    fontSize: 36,
  } as ViewStyle,
  flex1: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  } as ViewStyle,
  invisible: {
    opacity: 0,
  } as ViewStyle,
  keyword: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 10,
    paddingVertical:  5,
    borderRadius:    20,
    borderWidth:     1,
    gap:             4,
  } as ViewStyle,
  keywordGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  } as ViewStyle,
  progressBar: {
    height: '100%',
  } as ViewStyle,
  progressTrack: {
    height:   4,
    width:    '100%',
    overflow: 'hidden',
  } as ViewStyle,
  relevanceText: {
    fontSize: 9,
  } as ViewStyle,
  rowIcon: {
    fontSize: 20,
  } as ViewStyle,
  rowLabel: {
    fontWeight: '600',
  } as ViewStyle,
  screen:  { flex: 1 } as ViewStyle,
  statusRow: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         14,
    borderRadius:    14,
    borderWidth:     1,
    gap:             12,
  } as ViewStyle,
  suggestedTitle: {
    fontWeight: '600',
  } as ViewStyle,
  summaryHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  summaryText: {
    lineHeight: 24,
  } as ViewStyle,
  tab: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      20,
    borderWidth:       1,
  } as ViewStyle,
  tabBar: {
    flexDirection:  'row',
    gap:            8,
    paddingBottom:  12,
  } as ViewStyle,
  tabLabel: {
    flexDirection: 'row',
    alignItems:    'center',
  } as ViewStyle,
  tabLabelActive: {
    fontWeight: '600',
  } as ViewStyle,
  tabLabelInactive: {
    fontWeight: '400',
  } as ViewStyle,
  taskText: {
    fontWeight: '500',
  } as ViewStyle,
});

export { AIScreen };
