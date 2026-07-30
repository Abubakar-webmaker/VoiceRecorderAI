import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { AuthHeader }  from '../components/AuthHeader';
import { Button }      from '@components/common/Button';
import { BodyMd, BodySm, H3, Caption } from '@components/common/Typography';
import { Card }        from '@components/common/Card';
import useAuth         from '../hooks/useAuth';
import useTheme        from '@hooks/useTheme';
import type { AuthScreenProps } from '@navigation/types';

const RESEND_COOLDOWN = 60; // seconds

type Props = AuthScreenProps<'VerifyEmail'>;

const VerifyEmailScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { email } = route.params;
  const { colors, spacing, borderRadius } = useTheme();
  const {
    resendVerification,
    isLoading,
    error,
    successMessage,
    dismissError,
    dismissSuccess,
    isEmailVerified,
    logout,
  } = useAuth();

  const [cooldown, setCooldown]   = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const checkScale = useSharedValue(0);
  const bounceY    = useSharedValue(0);

  // Email icon bounce
  useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600 }),
        withTiming(0,  { duration: 600 }),
      ),
      -1, false,
    );
  }, [bounceY]);

  // Verified check animation
  useEffect(() => {
    if (isEmailVerified) {
      checkScale.value = withSpring(1, { damping: 10, stiffness: 180 });
    }
  }, [checkScale, isEmailVerified]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity:   checkScale.value,
  }));

  const handleResend = useCallback(async (): Promise<void> => {
    if (cooldown > 0) return;
    await resendVerification();
    setResendCount((c) => c + 1);
    setCooldown(RESEND_COOLDOWN);
    dismissSuccess();
  }, [cooldown, resendVerification, dismissSuccess]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
  }, [logout]);

  if (isEmailVerified) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.bg.primary }]}
        edges={['top', 'bottom']}
      >
        <Animated.View style={[styles.center, checkStyle]}>
          <View
            style={[
              styles.successCircle,
              { backgroundColor: colors.ai.surface },
            ]}
          >
            <BodyMd style={{ fontSize: 56 }}>✅</BodyMd>
          </View>
          <H3 align="center" color="primary">Email Verified!</H3>
          <BodyMd color="secondary" align="center">
            Your account is now active. Redirecting you...
          </BodyMd>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      <AuthHeader />

      <View style={styles.container}>
        {/* Animated Email Icon */}
        <Animated.View entering={FadeIn.delay(100)} style={bounceStyle}>
          <View
            style={[
              styles.emailIcon,
              {
                backgroundColor: colors.primary.surface,
                borderColor:     `${colors.primary.default}30`,
              },
            ]}
          >
            <BodyMd style={{ fontSize: 56 }}>📧</BodyMd>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ gap: spacing[2], alignItems: 'center' }}
        >
          <H3 align="center" color="primary">Verify your email</H3>

          <BodyMd color="secondary" align="center">
            We sent a verification link to{'\n'}
            <BodyMd color="primary" style={{ fontWeight: '600' }}>
              {email}
            </BodyMd>
          </BodyMd>
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(500)}
          style={{ width: '100%' }}
        >
          <Card variant="outlined">
            <View style={{ gap: spacing[2] }}>
              <BodySm color="secondary">
                📬 Check your inbox and click the verification link.
              </BodySm>
              <BodySm color="secondary">
                🕐 Link expires in 24 hours.
              </BodySm>
              <BodySm color="secondary">
                📁 Don't see it? Check your spam folder.
              </BodySm>
            </View>
          </Card>
        </Animated.View>

        {/* Resend */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={{ gap: spacing[3], width: '100%', alignItems: 'center' }}
        >
          {error != null && (
            <Caption style={{ color: colors.error.text }} align="center">
              {error}
            </Caption>
          )}

          <Button
            label={
              cooldown > 0
                ? `Resend in ${cooldown}s`
                : resendCount > 0
                ? 'Resend Email'
                : 'Resend Verification Email'
            }
            onPress={handleResend}
            variant={cooldown > 0 ? 'ghost' : 'outline'}
            size="md"
            fullWidth
            isLoading={isLoading}
            isDisabled={cooldown > 0}
          />

          <Button
            label="Sign in with different account"
            onPress={handleLogout}
            variant="ghost"
            size="sm"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 } as ViewStyle,
  container: {
    flex:              1,
    paddingHorizontal: 24,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               24,
  } as ViewStyle,
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            16,
    paddingHorizontal: 24,
  } as ViewStyle,
  emailIcon: {
    width:        120,
    height:       120,
    borderRadius: 30,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
  } as ViewStyle,
  successCircle: {
    width:        120,
    height:       120,
    borderRadius: 60,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: 16,
  } as ViewStyle,
});

export { VerifyEmailScreen };