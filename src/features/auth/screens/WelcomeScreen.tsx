import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient   from 'react-native-linear-gradient';

import { Button }     from '@components/common/Button';
import { Typography, H1, BodyMd, Caption } from '@components/common/Typography';
import { colors, spacing, borderRadius } from '@theme/index';
import type { AuthScreenProps }          from '@navigation/types';

const { width: W, height: H } = Dimensions.get('window');

// ─── Pulsing Ring ─────────────────────────────────────────────────
interface PulsingRingProps {
  delay:      number;
  size:       number;
  color:      string;
  duration:   number;
}

const PulsingRing = ({
  delay,
  size,
  color,
  duration,
}: PulsingRingProps): React.JSX.Element => {
  const scale   = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1, false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.2 }),
          withTiming(0,   { duration: duration * 0.8, easing: Easing.out(Easing.quad) }),
        ),
        -1, false,
      ),
    );
  }, [delay, duration, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position:     'absolute',
          width:        size,
          height:       size,
          borderRadius: size / 2,
          borderWidth:  1.5,
          borderColor:  color,
        },
        animStyle,
      ]}
    />
  );
};

// ─── Particle ─────────────────────────────────────────────────────
interface ParticleProps {
  x: number;
  y: number;
  delay: number;
  size: number;
}

const Particle = ({ x, y, delay, size }: ParticleProps): React.JSX.Element => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0,   { duration: 1000 }),
        ),
        -1, false,
      ),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1, true,
      ),
    );
  }, [delay, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position:        'absolute',
          left:            x,
          top:             y,
          width:           size,
          height:          size,
          borderRadius:    size / 2,
          backgroundColor: colors.primary.default,
        },
        animStyle,
      ]}
    />
  );
};

// ─── Main Orb Component ───────────────────────────────────────────
const RecordingOrb = (): React.JSX.Element => {
  const orbScale    = useSharedValue(1);
  const orbRotation = useSharedValue(0);

  useEffect(() => {
    // Subtle breathing animation
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
  }, [orbScale, orbRotation]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const ORB_SIZE = 140;

  return (
    <View style={styles.orbContainer}>
      {/* Pulsing rings — signature element */}
      <PulsingRing delay={0}    size={W * 0.75} color={`${colors.primary.default}25`} duration={2800} />
      <PulsingRing delay={900}  size={W * 0.60} color={`${colors.primary.default}30`} duration={2800} />
      <PulsingRing delay={1800} size={W * 0.45} color={`${colors.primary.default}40`} duration={2800} />

      {/* Orb */}
      <Animated.View style={[orbStyle]}>
        {/* Outer glow ring */}
        <View
          style={[
            styles.orbGlow,
            {
              width:        ORB_SIZE + 20,
              height:       ORB_SIZE + 20,
              borderRadius: (ORB_SIZE + 20) / 2,
              backgroundColor: `${colors.primary.default}15`,
            },
          ]}
        />

        {/* Main orb */}
        <View
          style={[
            styles.orb,
            {
              width:        ORB_SIZE,
              height:       ORB_SIZE,
              borderRadius: ORB_SIZE / 2,
            },
          ]}
        >
          {/* Gradient overlay */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius:    ORB_SIZE / 2,
                backgroundColor: colors.primary.default,
                opacity:         0.9,
              },
            ]}
          />

          {/* Mic icon */}
          <View style={styles.orbIcon}>
            {/* Mic body */}
            <View
              style={{
                width:        28,
                height:       40,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                opacity:      0.95,
              }}
            />
            {/* Mic stand */}
            <View
              style={{
                width:  2,
                height: 14,
                backgroundColor: '#FFFFFF',
                opacity: 0.8,
                marginTop: 4,
              }}
            />
            {/* Base */}
            <View
              style={{
                width:        20,
                height:       2,
                backgroundColor: '#FFFFFF',
                opacity: 0.8,
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Welcome Screen ───────────────────────────────────────────────
type Props = AuthScreenProps<'Welcome'>;

const WelcomeScreen = ({ navigation }: Props): React.JSX.Element => {
  // Particles config
  const particles = React.useMemo(() => [
    { x: W * 0.1,  y: H * 0.15, delay: 0,    size: 4 },
    { x: W * 0.85, y: H * 0.2,  delay: 400,  size: 3 },
    { x: W * 0.05, y: H * 0.55, delay: 800,  size: 5 },
    { x: W * 0.92, y: H * 0.65, delay: 200,  size: 3 },
    { x: W * 0.15, y: H * 0.78, delay: 600,  size: 4 },
    { x: W * 0.78, y: H * 0.82, delay: 1000, size: 3 },
  ], []);

  return (
    <View style={styles.screen}>
      {/* Background gradient */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.bg.primary },
        ]}
      />

      {/* Subtle radial glow center */}
      <View
        style={[
          styles.centerGlow,
          {
            backgroundColor: `${colors.primary.default}08`,
          },
        ]}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      <SafeAreaView style={styles.safeArea}>
        {/* Orb Section */}
        <Animated.View
          entering={FadeIn.delay(100).duration(800)}
          style={styles.orbSection}
        >
          <RecordingOrb />
        </Animated.View>

        {/* Content Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(700).springify()}
          style={styles.content}
        >
          {/* Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.primary.surface,
                borderColor:     `${colors.primary.default}30`,
              },
            ]}
          >
            <Typography
              variant="labelSm"
              style={{ color: colors.primary.light, letterSpacing: 1.5 }}
            >
              ✦ POWERED BY AI
            </Typography>
          </View>

          {/* Headline */}
          <H1
            align="center"
            style={{ letterSpacing: -1, lineHeight: 38 }}
          >
            Record.{'\n'}
            <Typography
              variant="h1"
              style={{
                color: colors.primary.default,
                letterSpacing: -1,
                lineHeight: 38,
              }}
            >
              Understand.
            </Typography>{'\n'}
            Act.
          </H1>

          {/* Subtext */}
          <BodyMd color="secondary" align="center" style={styles.subtext}>
            Your voice — instantly transcribed, summarized, and analyzed by AI.
          </BodyMd>

          {/* CTA Buttons */}
          <View style={styles.buttons}>
            <Button
              label="Get Started Free"
              onPress={() => navigation.navigate('Register')}
              variant="primary"
              size="lg"
              fullWidth
            />
            <Button
              label="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="lg"
              fullWidth
            />
          </View>

          {/* Terms */}
          <Caption color="tertiary" align="center">
            By continuing, you agree to our{' '}
            <Caption color="secondary" style={{ textDecorationLine: 'underline' }}>
              Terms of Service
            </Caption>
            {' '}and{' '}
            <Caption color="secondary" style={{ textDecorationLine: 'underline' }}>
              Privacy Policy
            </Caption>
          </Caption>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  } as ViewStyle,
  centerGlow: {
    position:     'absolute',
    width:        W * 1.2,
    height:       W * 1.2,
    borderRadius: W * 0.6,
    top:          H * 0.05,
    alignSelf:    'center',
  } as ViewStyle,
  safeArea: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  orbSection: {
    flex:           0.5,
    alignItems:     'center',
    justifyContent: 'center',
    width:          '100%',
  } as ViewStyle,
  orbContainer: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          W,
    height:         W * 0.8,
  } as ViewStyle,
  orbGlow: {
    position:       'absolute',
    alignSelf:      'center',
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  orb: {
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  } as ViewStyle,
  orbIcon: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  content: {
    flex:              0.5,
    width:             '100%',
    paddingHorizontal: spacing[6],
    paddingBottom:     spacing[4],
    alignItems:        'center',
    gap:               spacing[4],
  } as ViewStyle,
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
    borderRadius:      borderRadius.full,
    borderWidth:       1,
  } as ViewStyle,
  subtext: {
    maxWidth: 280,
  } as ViewStyle,
  buttons: {
    width: '100%',
    gap:   spacing[3],
  } as ViewStyle,
});

export { WelcomeScreen };