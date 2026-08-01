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

import { Typography, H2, H3, H4, BodySm, Caption, Label, MonoText }
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
import { formatDuration, formatFileSize } from '@types/recording.types';
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
            ...styles.orbShadow,
          },
          orbStyle,
        ]}
      >
        <Typography variant="displaySm" align="center">🎙</Typography>
      </Animated.View>

      <Caption
        color="secondary"
        align="center"
        style={{ marginTop: spacing[3] }}
      >
        Tap to record
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
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.statItem, { backgroundColor: colors.bg.elevated }]}>
      <Caption style={{ fontSize: 20 }}>{icon}</Caption>
      <MonoText style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>
        {value}
      </MonoText>
      <Caption color="secondary">{label}</Caption>
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
    <View style={{ gap: 8 }}>
      <View style={styles.storageRow}>
        <Caption color="secondary">
          {formatFileSize(storage.used)} used
        </Caption>
        <Caption color="tertiary">
          {formatFileSize(storage.limit)} total
        </Caption>
      </View>
      <View
        style={[
          styles.storageTrack,
          { backgroundColor: colors.border.default, borderRadius: borderRadius.full },
        ]}
      >
        <Animated.View
          style={[
            styles.storageFill,
            { backgroundColor: barColor, borderRadius: borderRadius.full },
            barStyle,
          ]}
        />
      </View>
      <Caption color="tertiary">
        {storage.percent}% of storage used
      </Caption>
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
  }, []);

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
        {/* ─── Header ─────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={[styles.header, { paddingTop: spacing[2] }]}
        >
          <View style={{ flex: 1 }}>
            <Caption color="secondary">{greeting} 👋</Caption>
            <H3 color="primary" style={{ marginTop: 2 }}>
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
              String(recordings.filter((r) => r.ai.transcriptionStatus === 'completed').length)
            }
            label="Transcribed"
          />
        </Animated.View>

        {/* ─── Storage ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <Card variant="filled" style={{ marginBottom: spacing[5] }}>
            <View style={{ gap: spacing[3] }}>
              <View style={styles.sectionHeader}>
                <H4 color="primary">Storage</H4>
                <Badge label="Free" variant="neutral" size="sm" />
              </View>
              <StorageBar />
            </View>
          </Card>
        </Animated.View>

        {/* ─── Recent Recordings ───────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View style={[styles.sectionHeader, { marginBottom: spacing[3] }]}>
            <H4 color="primary">Recent</H4>
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.navigate('RecordingsTab' as never)
              }
            >
              <BodySm color="link">See all →</BodySm>
            </TouchableOpacity>
          </View>

          {isLoading && recordings.length === 0 ? (
            <Loader size="md" label="Loading recordings..." />
          ) : recentRecordings.length === 0 ? (
            <Card variant="outlined">
              <View style={{ alignItems: 'center', gap: spacing[3], padding: spacing[4] }}>
                <Typography variant="displaySm" align="center">🎙️</Typography>
                <H4 color="primary" align="center">No recordings yet</H4>
                <BodySm color="secondary" align="center">
                  Tap the mic button to start your first recording
                </BodySm>
                <TouchableOpacity onPress={navigateToRecord}>
                  <BodySm color="link">Start recording →</BodySm>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            recentRecordings.map((recording) => (
              <RecordingCard
                key={recording._id}
                recording={recording}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('RecordingsTab' as never, {
                      screen: 'RecordingDetail',
                      params: { recordingId: recording._id },
                    } as never)
                }
                onPlay={() => play(recording)}
                onFavorite={() => toggleFavorite(recording._id)}
                onDelete={() => deleteRecording(recording._id)}
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
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1, paddingBottom: 24 } as ViewStyle,
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   20,
  } as ViewStyle,
  orbSection: {
    alignItems:   'center',
    marginBottom: 28,
  } as ViewStyle,
  orbWrapper: {
    alignItems: 'center',
  } as ViewStyle,
  orb: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  orbRing: {
    position:     'absolute',
    width:        100,
    height:       100,
    borderRadius: 50,
    borderWidth:  2,
  } as ViewStyle,
  orbShadow: {
    shadowColor:   '#FF6B6B',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius:  20,
    elevation:     12,
  } as ViewStyle,
  statsRow: {
    flexDirection:  'row',
    gap:            10,
    marginBottom:   20,
  } as ViewStyle,
  statItem: {
    flex:           1,
    alignItems:     'center',
    padding:        12,
    borderRadius:   16,
    gap:            4,
  } as ViewStyle,
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  storageRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  storageTrack: {
    height:   6,
    width:    '100%',
    overflow: 'hidden',
  } as ViewStyle,
  storageFill: {
    height: '100%',
  } as ViewStyle,
});

export { HomeScreen };