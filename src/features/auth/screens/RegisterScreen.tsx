import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView }        from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuthHeader }  from '../components/AuthHeader';
import { Button }      from '@components/common/Button';
import { Input }       from '@components/common/Input';
import { BodyMd, BodySm, Caption } from '@components/common/Typography';
import useAuth         from '../hooks/useAuth';
import useTheme        from '@hooks/useTheme';
import type { AuthScreenProps } from '@navigation/types';

// ─── Password Strength ────────────────────────────────────────────
interface StrengthResult {
  score:  0 | 1 | 2 | 3 | 4;
  label:  string;
  color:  string;
}

const getPasswordStrength = (password: string, colors: ReturnType<typeof useTheme>['colors']): StrengthResult => {
  let score = 0;
  if (password.length >= 8)                         score++;
  if (/[A-Z]/.test(password))                       score++;
  if (/[0-9]/.test(password))                       score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password))     score++;

  const map: Record<number, StrengthResult> = {
    0: { score: 0, label: '',          color: 'transparent' },
    1: { score: 1, label: 'Weak',      color: colors.recording.default },
    2: { score: 2, label: 'Fair',      color: colors.warning.default },
    3: { score: 3, label: 'Good',      color: colors.ai.light },
    4: { score: 4, label: 'Strong',    color: colors.ai.default },
  };

  return map[score] ?? map[0]!;
};

// ─── Zod Schema ───────────────────────────────────────────────────
const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2,  'Name must be at least 2 characters')
      .max(50, 'Name is too long')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[0-9]/, 'Add a number')
      .regex(/[!@#$%^&*]/, 'Add a special character'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path:    ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

type Props = AuthScreenProps<'Register'>;

const RegisterScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const {
    register,
    isLoading,
    error,
    dismissError,
  } = useAuth();

  const [passwordValue, setPasswordValue] = useState('');
  const strength = getPasswordStrength(passwordValue, colors);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver:      zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode:          'onTouched',
  });

  useEffect(() => {
    if (error != null) {
      setError('email', { message: error });
      dismissError();
    }
  }, [error, setError, dismissError]);

  const onSubmit = useCallback(
    async (data: RegisterForm): Promise<void> => {
      await register(data);
    },
    [register],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader
            title="Create account"
            subtitle="Start for free — no credit card needed"
            showBack
            onBack={() => navigation.goBack()}
          />

          <Animated.View
            entering={FadeInDown.delay(150).duration(500).springify()}
            style={[styles.form, { gap: spacing[4] }]}
          >
            {/* Name */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Abu Bakar"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                />
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              )}
            />

            {/* Password */}
            <View style={{ gap: spacing[2] }}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Min. 8 characters"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      setPasswordValue(text);
                    }}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    isPassword
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                  />
                )}
              />

              {/* Strength Meter */}
              {passwordValue.length > 0 && (
                <View style={{ gap: spacing[1.5] }}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4].map((s) => (
                      <View
                        key={s}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              s <= strength.score
                                ? strength.color
                                : colors.border.default,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  {strength.label.length > 0 && (
                    <Caption style={{ color: strength.color }}>
                      Password strength: {strength.label}
                    </Caption>
                  )}
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  isPassword
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(350).duration(500)}
            style={[styles.footer, { gap: spacing[1] }]}
          >
            <BodyMd color="secondary" align="center">
              Already have an account?{' '}
              <BodyMd
                color="link"
                onPress={() => navigation.navigate('Login')}
                style={{ fontWeight: '600' }}
              >
                Sign in
              </BodyMd>
            </BodyMd>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 } as ViewStyle,
  scroll: { flexGrow: 1, paddingBottom: 40 } as ViewStyle,
  form:   { paddingHorizontal: 20, marginTop: 24 } as ViewStyle,
  footer: { marginTop: 32, paddingHorizontal: 20, alignItems: 'center' } as ViewStyle,
  strengthBar: {
    flexDirection: 'row',
    gap:           4,
  } as ViewStyle,
  strengthSegment: {
    flex:         1,
    height:       3,
    borderRadius: 2,
  } as ViewStyle,
});

export { RegisterScreen };