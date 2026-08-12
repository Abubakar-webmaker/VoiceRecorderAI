import React, { useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';

import { Typography, H3, H4, BodySm, Caption, MonoText }
  from '@components/common/Typography';
import { Card }           from '@components/common/Card';
import { Badge }          from '@components/common/Badge';
import { Avatar }         from '@components/common/Avatar';
import { Loader }         from '@components/common/Loader';
import { RecordingCard }  from '@components/recording/RecordingCard';
import useTheme           from '@hooks/useTheme';
import useAuth            from '@features/auth/hooks/useAuth';
import useRecordings      from '../hooks/useRecordings';
import usePlayer          from '@features/player/hooks/usePlayer';
import { formatDuration, formatFileSize, AIStatus } from '@types/recording.types';
import type { HomeScreenProps } from '@navigation/types';

const { width: W } = Dimensions.get('window');

// ─── Quick Record Orb ─────────────────────────────────────────────
interface QuickRecordOrbProps {
  onPress: () => void;
}

const QuickRecordOrb = ({ onPress }: QuickRecordOrbProps): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const pulse  = useSharedValue(1);
  const ring   = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
    ring.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
      -1, false,
    );
  }, [pulse, ring]);

  const orbStyle  = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform:  [{ scale: 0.8 + ring.value * 0.4 }],
    opacity:    1 - ring.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.orbWrapper}
      accessibilityRole="button"
      accessibilityLabel="Start new recording"
    >
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.orbRing,
          { borderColor: colors.recording.default },
          ringStyle,
        ]}
      />

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            backgroundColor: colors.recording.default,
          },
          styles.orbShadow,
          orbStyle,
        ]}
      >
        <Typography variant="displaySm" align="center"><Typography variant="displaySm">🎙</Typography></Typography>
      </Animated.View>

      <Caption
        color="secondary"
        align="center"
        style={styles.orbLabel}
      >
        <Caption>Tap to record</Caption>
      </Caption>
    </TouchableOpacity>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────
interface StatItemProps {
  label: string;
  value: string;
  icon:  string;
}

const StatItem = ({ label, value, icon }: StatItemProps): React.JSX.Element => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.statItem,
        {
          backgroundColor: colors.bg.elevated,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: `${colors.primary.default}10` }
        ]}
      >
        <Typography style={styles.statIcon}><Typography>{icon}</Typography></Typography>
      </View>
      <MonoText style={[styles.statValue, { color: colors.text.primary }]}>
        <MonoText>{value}</MonoText>
      </MonoText>
      <Caption color="tertiary" style={styles.statLabel}>
        <Caption>{label}</Caption>
      </Caption>
    </View>
  );
};

// ─── Storage Bar ──────────────────────────────────────────────────
const StorageBar = (): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const { storage } = useAuth();
  const barWidth    = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withSpring(storage.percent / 100, {
      damping: 20, stiffness: 100,
    });
  }, [barWidth, storage.percent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  const barColor = storage.percent > 90
    ? colors.recording.default
    : storage.percent > 70
    ? colors.warning.default
    : colors.primary.default;

  return (
    <View style={styles.storageContainer}>
      <View style={styles.storageRow}>
        <View style={styles.storageUsedRow}>
          <View style={[styles.storageDot, { backgroundColor: barColor }]} />
          <Caption color="secondary" style={styles.fontWeight600}>
            <Caption>{formatFileSize(storage.used)} used</Caption>
          </Caption>
        </View>
        <Caption color="tertiary">
          <Caption>{formatFileSize(storage.limit)} total</Caption>
        </Caption>
      </View>
      <View
        style={[
          styles.storageTrack,
          {
            backgroundColor: colors.border.default,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.storageFill,
            {
              backgroundColor: barColor,
              borderRadius: borderRadius.full,
              shadowColor: barColor,
            },
            barStyle,
          ]}
        />
      </View>
      <View style={styles.storageBottomRow}>
        <Caption color="tertiary" style={styles.storagePercentText}>
          <Caption>{storage.percent}% of storage used</Caption>
        </Caption>
        {storage.percent > 80 && (
          <Badge label="Running Low" variant="warning" size="sm" />
        )}
      </View>
    </View>
  );
};

// ─── Home Screen ──────────────────────────────────────────────────
type Props = HomeScreenProps<'Home'>;

const HomeScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const { user }     = useAuth();
  const {
    recordings, isLoading, totalRecordings,
    fetchRecordings, toggleFavorite, deleteRecording,
  } = useRecordings();
  const { play } = usePlayer();

  const [refreshing, setRefreshing] = React.useState(false);

  const recentRecordings = recordings.slice(0, 5);

  // Greeting
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Total duration
  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);

  useEffect(() => {
    void fetchRecordings({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  }, [fetchRecordings]);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchRecordings({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    setRefreshing(false);
  }, [fetchRecordings]);

  const navigateToRecord = useCallback((): void => {
    navigation
      .getParent()
      ?.navigate('RecordTab' as never);
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing[5] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.default}
            colors={[colors.primary.default]}
          />
        }
      >
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={[styles.header, { paddingTop: spacing[2] }]}
        >
          <View style={styles.flex1}>
            <Caption color="secondary"><Caption>{greeting} 👋</Caption></Caption>
            <H3 color="primary" style={styles.welcomeText}>
              {user?.name ?? 'Welcome back'}
            </H3>
          </View>
          <Avatar
            name={user?.name ?? 'U'}
            uri={user?.avatar ?? undefined}
            size="md"
          />
        </Animated.View>

        {/* ─── Quick Record Orb ────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.orbSection}
        >
          <QuickRecordOrb onPress={navigateToRecord} />
        </Animated.View>

        {/* ─── Stats Row ───────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsRow}
        >
          <StatItem
            icon="🎙"
            value={String(totalRecordings)}
            label="Recordings"
          />
          <StatItem
            icon="⏱"
            value={formatDuration(totalDuration)}
            label="Total Time"
          />
          <StatItem
            icon="✨"
            value={
              String(recordings.filter((r) => r.ai.transcriptionStatus === AIStatus.COMPLETED).length)
            }
            label="Transcribed"
          />
        </Animated.View>

        {/* ─── Storage ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <Card variant="filled" style={{ marginBottom: spacing[5] }}>
            <View style={{ gap: spacing[3] }}>
              <View style={styles.sectionHeader}>
                <H4 color="primary"><BodySm>Storage</BodySm></H4>
                <TouchableOpacity
                  onPress={() => { (navigation as any).navigate('Subscription'); }}
                >
                  <Badge label="Upgrade" variant="primary" size="sm" />
                </TouchableOpacity>
              </View>
              <StorageBar />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View style={[styles.sectionHeader, { marginBottom: spacing[3] }]}>
            <H4 color="primary"><BodySm>Recent</BodySm></H4>
            <TouchableOpacity
              onPress={() => {
                (navigation as any).getParent()?.navigate('RecordingsTab');
              }}
            >
              <BodySm color="link"><BodySm>See all →</BodySm></BodySm>
            </TouchableOpacity>
          </View>

          {isLoading && recordings.length === 0 ? (
            <Loader size="md" label="Loading recordings..." />
          ) : recentRecordings.length === 0 ? (
            <Card variant="outlined">
              <View style={styles.emptyRecent}>
                <Typography variant="displaySm" align="center"><Typography variant="displaySm">🎙️</Typography></Typography>
                <H4 color="primary" align="center"><BodySm>No recordings yet</BodySm></H4>
                <BodySm color="secondary" align="center">
                  <BodySm>Tap the mic button to start your first recording</BodySm>
                </BodySm>
                <TouchableOpacity onPress={() => { navigateToRecord(); }}>
                  <BodySm color="link"><BodySm>Start recording →</BodySm></BodySm>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            recentRecordings.map((recording) => (
              <RecordingCard
                key={recording._id}
                recording={recording}
                onPress={() => {
                  (navigation as any)
                    .getParent()
                    ?.navigate('RecordingsTab', {
                      screen: 'RecordingDetail',
                      params: { recordingId: recording._id },
                    });
                }}
                onPlay={() => { void play(recording); }}
                onFavorite={() => { void toggleFavorite(recording._id); }}
                onDelete={() => { void deleteRecording(recording._id); }}
              />
            ))
          )}
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptyRecent: {
    alignItems: 'center',
    gap: 12,
    padding: 16
  },
  flex1: {
    flex: 1
  },
  fontWeight600: {
    fontWeight: '600'
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   20,
  } as ViewStyle,
  orb: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  orbLabel: {
    marginTop: 12
  },
  orbRing: {
    position:     'absolute',
    width:        100,
    height:       100,
    borderRadius: 50,
    borderWidth:  2,
  } as ViewStyle,
  orbSection: {
    alignItems:   'center',
    marginBottom: 28,
  } as ViewStyle,
  orbShadow: {
    shadowColor:   '#FF6B6B',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius:  20,
    elevation:     12,
  } as ViewStyle,
  orbWrapper: {
    alignItems: 'center',
  } as ViewStyle,
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1, paddingBottom: 24 } as ViewStyle,
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  statIcon: {
    fontSize: 24
  },
  statIconContainer: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
    width: 44,
  },
  statItem: {
    flex:           1,
    alignItems:     'center',
    padding:        12,
    borderRadius:   16,
    gap:            4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  } as ViewStyle,
  statLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection:  'row',
    gap:            10,
    marginBottom:   20,
  } as ViewStyle,
  storageBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  storageContainer: {
    gap: 10
  },
  storageDot: {
    borderRadius: 4,
    height: 8,
    width: 8
  },
  storageFill: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  } as ViewStyle,
  storagePercentText: {
    fontSize: 11
  },
  storageRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  storageTrack: {
    height:   10,
    width:    '100%',
    overflow: 'hidden',
  } as ViewStyle,
  storageUsedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  welcomeText: {
    marginTop: 2
  },
});

export { HomeScreen };