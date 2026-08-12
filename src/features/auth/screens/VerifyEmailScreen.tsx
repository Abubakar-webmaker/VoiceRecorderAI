import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
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

const VerifyEmailScreen = ({ route }: Props): React.JSX.Element => {
  const { email } = route.params;
  const { colors } = useTheme();
  const {
    resendVerification,
    isLoading,
    error,
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
              <BodyMd style={styles.emojiLarge}>
                ✅
              </BodyMd>
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
              <BodyMd style={styles.emojiLarge}>
                📧
              </BodyMd>
            </View>
          </Animated.View>

          {/* Content */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.contentContainer}
          >
            <H3 align="center" color="primary">Verify your email</H3>

            <BodyMd color="secondary" align="center">
              We sent a verification link to{' '}
              <BodyMd color="primary" style={styles.emailText}>
                {email}
              </BodyMd>
            </BodyMd>
          </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(500)}
          style={styles.fullWidth}
        >
          <Card variant="outlined">
            <View style={styles.cardContent}>
              <BodySm color="secondary">
                📬 Check your inbox and click the verification link.
              </BodySm>
              <BodySm color="secondary">
                🕐 Link expires in 24 hours.
              </BodySm>
              <BodySm color="secondary">
                📁 Don&apos;t see it? Check your spam folder.
              </BodySm>
            </View>
          </Card>
        </Animated.View>

        {/* Resend */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.resendContainer}
        >
          {error !== null && (
            <Caption style={[styles.errorText, { color: colors.error.text }]} align="center">
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
            onPress={() => { void handleResend(); }}
            variant={cooldown > 0 ? 'ghost' : 'outline'}
            size="md"
            fullWidth
            isLoading={isLoading}
            isDisabled={cooldown > 0}
          />

          <Button
            label="Sign in with different account"
            onPress={() => { void handleLogout(); }}
            variant="ghost"
            size="sm"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    gap: 8,
  } as ViewStyle,
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            16,
    paddingHorizontal: 24,
  } as ViewStyle,
  container: {
    flex:              1,
    paddingHorizontal: 24,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               24,
  } as ViewStyle,
  contentContainer: {
    gap: 8,
    alignItems: 'center',
  } as ViewStyle,
  emailIcon: {
    width:        120,
    height:       120,
    borderRadius: 30,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
  } as ViewStyle,
  emailText: {
    fontWeight: '600',
  },
  emojiLarge: {
    fontSize: 56,
  },
  errorText: {
  },
  fullWidth: {
    width: '100%',
  } as ViewStyle,
  resendContainer: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
  } as ViewStyle,
  screen: { flex: 1 } as ViewStyle,
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