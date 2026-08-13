import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { Avatar }        from '@components/common/Avatar';
import { Button }        from '@components/common/Button';
import { Input }         from '@components/common/Input';
import { Card }          from '@components/common/Card';
import { Divider }       from '@components/common/Divider';
import {
  H3, H5, BodySm, Caption,
} from '@components/common/Typography';
import useTheme          from '@hooks/useTheme';
import useAuth           from '@features/auth/hooks/useAuth';
import useAppSelector    from '@hooks/useAppSelector';
import { selectStorageInfo } from '@features/auth/store/authSelectors';
import { formatStorageSize } from '@types/user.types';
import { updateProfileApi } from '@features/auth/services/auth.api';
import { updateUser }    from '@features/auth/store/authSlice';
import useAppDispatch    from '@hooks/useAppDispatch';
import type { SettingsScreenProps } from '@navigation/types';

type Props = SettingsScreenProps<'Profile'>;

const ProfileScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const dispatch = useAppDispatch();
  const { user, logout, isLoading } = useAuth();
  const storage  = useAppSelector(selectStorageInfo);

  const [name,        setName]        = useState(user?.name ?? '');
  const [nameError,   setNameError]   = useState<string | undefined>(undefined);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Storage bar animation
  const fillWidth = useSharedValue(0);
  React.useEffect(() => {
    fillWidth.value = withSpring(storage.percent / 100, {
      damping:   20,
      stiffness: 100,
    });
  }, [fillWidth, storage.percent]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  // ─── Save Name ────────────────────────────────────────────────
  const handleSaveName = useCallback(async (): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameError(undefined);
    setIsSavingName(true);
    try {
      const updated = await updateProfileApi({ name: trimmed });
      dispatch(updateUser({ name: updated.name }));
      Alert.alert('Success', 'Your name has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  }, [name, dispatch]);

  // ─── Change Avatar ────────────────────────────────────────────
  const handleChangeAvatar = useCallback((): void => {
    void launchImageLibrary(
      {
        mediaType:   'photo',
        quality:     0.8,
        maxWidth:    800,
        maxHeight:   800,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel || !response.assets?.[0]) return;
        const asset = response.assets[0];
        if (!asset.uri) return;

        setIsUploadingAvatar(true);
        try {
          // Phase 11 mein — avatar upload to Cloudinary
          // const avatarUrl = await uploadAvatarToCloudApi(asset.uri);
          // dispatch(updateUser({ avatar: avatarUrl }));
          Alert.alert('Coming Soon', 'Avatar upload will be available in the next update.');
        } finally {
          setIsUploadingAvatar(false);
        }
      },
    );
  }, []);

  // ─── Logout ───────────────────────────────────────────────────
  const handleLogout = useCallback((): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Sign Out',
          style:   'destructive',
          onPress: () => { void logout(); },
        },
      ],
    );
  }, [logout]);

  // ─── Delete Account ───────────────────────────────────────────
  const handleDeleteAccount = useCallback((): void => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all recordings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete Account',
          style:   'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm',
              'Type DELETE to confirm',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text:    'I understand, delete my account',
                  style:   'destructive',
                  onPress: () => { /* Phase 11 mein implement */ },
                },
              ],
            );
          },
        },
      ],
    );
  }, []);

  const storageColor =
    storage.percent > 90 ? colors.recording.default :
    storage.percent > 70 ? colors.warning.default   :
    colors.primary.default;

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
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ──────────────────────────────────────── */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption color="secondary">←</Caption>
          </TouchableOpacity>
          <H3 color="primary">Profile</H3>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* ─── Avatar Section ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.avatarSection}
        >
          <TouchableOpacity
            onPress={() => { handleChangeAvatar(); }}
            disabled={isUploadingAvatar}
            style={styles.avatarButton}
          >
            <View>
              <Avatar
                name={user?.name ?? 'U'}
                uri={user?.avatar ?? undefined}
                size="xl"
                showBorder
              />
              {/* Edit badge */}
              <View
                style={[
                  styles.editBadge,
                  { backgroundColor: colors.primary.default },
                ]}
              >
                <Caption style={styles.editBadgeIcon}>✏</Caption>
              </View>
            </View>
            <BodySm style={{ color: colors.primary.light }}>
              {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </BodySm>
          </TouchableOpacity>

          <H3 color="primary" align="center">{user?.name ?? 'User'}</H3>
          <Caption color="secondary" align="center">{user?.email}</Caption>
        </Animated.View>

        {/* ─── Edit Name ───────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          style={styles.editNameSection}
        >
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            error={nameError}
            placeholder="Enter your name"
            returnKeyType="done"
            onSubmitEditing={() => { void handleSaveName(); }}
          />
          {name !== user?.name && (
            <Button
              label="Save Name"
              onPress={() => { void handleSaveName(); }}
              variant="primary"
              size="md"
              isLoading={isSavingName}
              fullWidth
            />
          )}
        </Animated.View>

        {/* ─── Account Info ─────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={styles.accountInfoSection}
        >
          <Card variant="filled">
            <View style={styles.cardContent}>
              <H5 color="primary">Account</H5>
              {[
                { label: 'Email',        value: user?.email ?? '' },
                { label: 'Account Type', value: (user?.role ?? 'free').charAt(0).toUpperCase() + (user?.role ?? 'free').slice(1) },
                { label: 'Member Since', value: 'N/A' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <Caption color="tertiary">{label}</Caption>
                  <BodySm color="secondary">{value}</BodySm>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* ─── Storage ──────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={styles.storageSection}
        >
          <Card variant="filled">
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <H5 color="primary"><BodySm>Storage</BodySm></H5>
                <TouchableOpacity
                  onPress={() => navigation.navigate('StorageManager')}
                >
                  <Caption color="link">Manage →</Caption>
                </TouchableOpacity>
              </View>

              {/* Bar */}
              <View
                style={[
                  styles.storageTrack,
                  {
                    backgroundColor: colors.border.default,
                    borderRadius:    borderRadius.full,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.storageFill,
                    { backgroundColor: storageColor, borderRadius: borderRadius.full },
                    fillStyle,
                  ]}
                />
              </View>

              <View style={styles.storageInfo}>
                <Caption color="secondary">
                  {formatStorageSize(storage.used)} used
                </Caption>
                <Caption color="tertiary">
                  {formatStorageSize(storage.limit)} total
                </Caption>
              </View>

              <BodySm
                style={[
                  styles.storageStatusText,
                  { color: storageColor }
                ]}
              >
                {storage.percent}% used
                {storage.percent > 80 && (
                  ' — Consider upgrading to Pro'
                )}
              </BodySm>

              {storage.percent > 70 && (
                <Button
                  label="Upgrade Storage"
                  onPress={() => { navigation.navigate('Subscription'); }}
                  variant="primary"
                  size="sm"
                />
              )}
            </View>
          </Card>
        </Animated.View>

        {/* ─── Danger Zone ──────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.dangerZone}
        >
          <Divider label="DANGER ZONE" />

          <Button
            label="Sign Out"
            onPress={() => { handleLogout(); }}
            variant="outline"
            size="md"
            fullWidth
            isLoading={isLoading}
          />

          <Button
            label="Delete Account"
            onPress={() => { handleDeleteAccount(); }}
            variant="danger"
            size="md"
            fullWidth
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  accountInfoSection: {
    marginBottom: 20,
  },
  avatarButton: {
    alignItems: 'center',
    gap: 8
  },
  avatarSection: {
    alignItems:   'center',
    gap:          8,
    marginBottom: 28,
    paddingTop:   8,
  } as ViewStyle,
  backBtn: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  cardContent: {
    gap: 12
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  } as ViewStyle,
  dangerZone: {
    gap: 12,
    marginBottom: 32,
  },
  editBadge: {
    position:       'absolute',
    bottom:         2,
    right:          2,
    width:          24,
    height:         24,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  editBadgeIcon: {
    color: '#fff',
    fontSize: 10
  },
  editNameSection: {
    gap: 12,
    marginBottom: 20,
  },
  headerRightPlaceholder: {
    width: 40
  },
  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  } as ViewStyle,
  navRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom:   8,
  } as ViewStyle,
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1, paddingBottom: 40 } as ViewStyle,
  storageFill: {
    height: '100%',
  } as ViewStyle,
  storageInfo: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  storageSection: {
    marginBottom: 20,
  },
  storageStatusText: {
    fontWeight: '600'
  },
  storageTrack: {
    height:   6,
    width:    '100%',
    overflow: 'hidden',
  } as ViewStyle,
});

export { ProfileScreen };