import React, { useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar }        from '@components/common/Avatar';
import { Card }          from '@components/common/Card';
import { Badge }         from '@components/common/Badge';
import { Divider }       from '@components/common/Divider';
import {
  H3, H5, BodySm, Caption, Label,
} from '@components/common/Typography';
import useTheme          from '@hooks/useTheme';
import useAuth           from '@features/auth/hooks/useAuth';
import useSettings       from '../hooks/useSettings';
import { selectIsDark }  from '../store/themeSlice';
import useAppSelector    from '@hooks/useAppSelector';
import { formatStorageSize } from '@types/user.types';
import { selectStorageInfo } from '@features/auth/store/authSelectors';
import { requestNotificationPermission } from '@services/notification/notification.service';
import type { SettingsScreenProps } from '@navigation/types';

type Props = SettingsScreenProps<'Settings'>;

// ─── Settings Row ─────────────────────────────────────────────────
interface SettingsRowProps {
  icon:      string;
  label:     string;
  value?:    string;
  onPress?:  () => void;
  rightElement?: React.ReactNode;
  isLast?:   boolean;
}

const SettingsRow = ({
  icon, label, value, onPress, rightElement, isLast,
}: SettingsRowProps): React.JSX.Element => {
  const { colors, spacing } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.settingsRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border.default },
      ]}
    >
      <View style={styles.rowLeft}>
        <Caption style={{ fontSize: 20, width: 28 }}>{icon}</Caption>
        <BodySm color="primary">{label}</BodySm>
      </View>
      <View style={styles.rowRight}>
        {value != null && (
          <Caption color="tertiary">{value}</Caption>
        )}
        {rightElement != null
          ? rightElement
          : onPress != null && (
            <Caption color="tertiary">›</Caption>
          )
        }
      </View>
    </TouchableOpacity>
  );
};

// ─── Section Card ─────────────────────────────────────────────────
const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing[2] }}>
      <Label color="secondary" style={{ marginLeft: 4 }}>{title}</Label>
      <Card variant="filled" padding={0}>
        {children}
      </Card>
    </View>
  );
};

// ─── Main Settings Screen ─────────────────────────────────────────
const SettingsScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const { user }            = useAuth();
  const storage             = useAppSelector(selectStorageInfo);
  const isDark              = useAppSelector(selectIsDark);
  const {
    settings, themeMode,
    changeTheme,
    setAutoTranscribe, setAutoSummarize, setAutoKeywords,
    setPushNotif, setTranscriptionNotif,
    setAutoSync, setSyncOnWifi,
    fetchSettings,
  } = useSettings();

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleThemePress = useCallback((): void => {
    const modes = ['dark', 'light', 'system'] as const;
    const cur   = modes.indexOf(themeMode);
    const next  = modes[(cur + 1) % modes.length]!;
    changeTheme(next);
  }, [themeMode, changeTheme]);

  const themeLabel = {
    dark:   '🌙 Dark',
    light:  '☀️ Light',
    system: '💻 System',
  }[themeMode];

  const qualityLabel = {
    low:    '📉 Low (64 kbps)',
    medium: '📊 Medium (128 kbps)',
    high:   '📈 High (320 kbps)',
  }[settings.recording.quality];

  const formatLabel = settings.recording.format.toUpperCase();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: spacing[5] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ──────────────────────────────────────── */}
        <View style={[styles.header, { paddingVertical: 12 }]}>
          <H3 color="primary">Settings</H3>
        </View>

        {/* ─── Profile Card ────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={{ marginBottom: spacing[5] }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.card,
                borderColor:     colors.border.default,
              },
            ]}
            activeOpacity={0.85}
          >
            <Avatar
              name={user?.name ?? 'U'}
              uri={user?.avatar ?? undefined}
              size="lg"
            />
            <View style={{ flex: 1 }}>
              <BodySm color="primary" style={{ fontWeight: '600' }}>
                {user?.name ?? 'User'}
              </BodySm>
              <Caption color="secondary">{user?.email}</Caption>
              <View style={[styles.storagePreview, { marginTop: 6 }]}>
                <View
                  style={[
                    styles.miniStorageBar,
                    { backgroundColor: colors.border.default },
                  ]}
                >
                  <View
                    style={{
                      width:           `${storage.percent}%`,
                      height:          '100%',
                      backgroundColor: colors.primary.default,
                      borderRadius:    4,
                    }}
                  />
                </View>
                <Caption color="tertiary">
                  {formatStorageSize(storage.used)} / {formatStorageSize(storage.limit)}
                </Caption>
              </View>
            </View>
            <Caption color="tertiary">›</Caption>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Subscription ────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={{ marginBottom: spacing[5] }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Subscription')}
            style={[
              styles.upgradeCard,
              {
                backgroundColor: colors.primary.surface,
                borderColor:     `${colors.primary.default}30`,
              },
            ]}
          >
            <Caption style={{ fontSize: 24 }}>⚡</Caption>
            <View style={{ flex: 1 }}>
              <BodySm style={{ color: colors.primary.light, fontWeight: '700' }}>
                Upgrade to Pro
              </BodySm>
              <Caption style={{ color: colors.primary.default }}>
                Unlimited recordings · AI features · Cloud sync
              </Caption>
            </View>
            <Badge label="PRO" variant="primary" size="sm" />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ gap: spacing[4] }}>
          {/* ─── Appearance ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <SectionCard title="APPEARANCE">
              <SettingsRow
                icon="🎨"
                label="Theme"
                value={themeLabel}
                onPress={handleThemePress}
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── Recording ───────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <SectionCard title="RECORDING">
              <SettingsRow
                icon="🎚"
                label="Audio Quality"
                value={qualityLabel}
                onPress={() => navigation.navigate('AppSettings')}
              />
              <SettingsRow
                icon="🎵"
                label="Audio Format"
                value={formatLabel}
                onPress={() => navigation.navigate('AppSettings')}
              />
              <SettingsRow
                icon="🤖"
                label="Auto-Transcribe"
                rightElement={
                  <Switch
                    value={settings.recording.autoTranscribe}
                    onValueChange={setAutoTranscribe}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.primary.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <SettingsRow
                icon="📋"
                label="Auto-Summarize"
                rightElement={
                  <Switch
                    value={settings.recording.autoSummarize}
                    onValueChange={setAutoSummarize}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.primary.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── AI ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <SectionCard title="AI">
              <SettingsRow
                icon="🌐"
                label="Default Language"
                value={settings.ai.defaultLanguage.toUpperCase()}
                onPress={() => navigation.navigate('AppSettings')}
              />
              <SettingsRow
                icon="📊"
                label="Summary Length"
                value={
                  settings.ai.summaryLength.charAt(0).toUpperCase() +
                  settings.ai.summaryLength.slice(1)
                }
                onPress={() => navigation.navigate('AppSettings')}
              />
              <SettingsRow
                icon="🏷"
                label="Auto-Keywords"
                rightElement={
                  <Switch
                    value={settings.ai.autoKeywords}
                    onValueChange={setAutoKeywords}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.ai.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── Cloud & Sync ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240).duration(400)}>
            <SectionCard title="CLOUD & SYNC">
              <SettingsRow
                icon="☁️"
                label="Auto-Sync"
                rightElement={
                  <Switch
                    value={settings.storage.autoSync}
                    onValueChange={setAutoSync}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.primary.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <SettingsRow
                icon="📶"
                label="Sync on Wi-Fi Only"
                rightElement={
                  <Switch
                    value={settings.storage.syncOnWifiOnly}
                    onValueChange={setSyncOnWifi}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.primary.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <SettingsRow
                icon="💾"
                label="Storage Manager"
                onPress={() => navigation.navigate('StorageManager')}
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── Notifications ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).duration(400)}>
            <SectionCard title="NOTIFICATIONS">
              <SettingsRow
                icon="🔔"
                label="Push Notifications"
                rightElement={
                  <Switch
                    value={settings.notifications.push}
                    onValueChange={async (v) => {
                      if (v) await requestNotificationPermission();
                      setPushNotif(v);
                    }}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.primary.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <SettingsRow
                icon="✅"
                label="Transcription Done"
                rightElement={
                  <Switch
                    value={settings.notifications.transcriptionComplete}
                    onValueChange={setTranscriptionNotif}
                    trackColor={{
                      false: colors.border.default,
                      true:  colors.ai.default,
                    }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <SettingsRow
                icon="📬"
                label="Notification Settings"
                onPress={() => navigation.navigate('NotificationPrefs')}
                isLast
              />
            </SectionCard>
          </Animated.View>

          {/* ─── About ───────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).duration(400)}>
            <SectionCard title="ABOUT">
              <SettingsRow
                icon="ℹ️"
                label="App Version"
                value="1.0.0"
              />
              <SettingsRow
                icon="📄"
                label="Privacy Policy"
                onPress={() => {}}
              />
              <SettingsRow
                icon="📋"
                label="Terms of Service"
                onPress={() => {}}
              />
              <SettingsRow
                icon="⭐"
                label="Rate the App"
                onPress={() => {}}
                isLast
              />
            </SectionCard>
          </Animated.View>
        </View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1 } as ViewStyle,
  header:  {} as ViewStyle,
  profileCard: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    borderRadius:    16,
    borderWidth:     1,
    gap:             12,
  } as ViewStyle,
  upgradeCard: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    borderRadius:    16,
    borderWidth:     1,
    gap:             12,
  } as ViewStyle,
  settingsRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight:       52,
  } as ViewStyle,
  rowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    flex:          1,
  } as ViewStyle,
  rowRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  } as ViewStyle,
  storagePreview: {
    gap: 4,
  } as ViewStyle,
  miniStorageBar: {
    width:        120,
    height:       3,
    borderRadius: 2,
    overflow:     'hidden',
  } as ViewStyle,
});

export { SettingsScreen };