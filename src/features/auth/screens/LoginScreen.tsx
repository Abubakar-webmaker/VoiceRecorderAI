import React, { useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuthHeader }   from '../components/AuthHeader';
import { Button }       from '@components/common/Button';
import { Input }        from '@components/common/Input';
import { Divider }      from '@components/common/Divider';
import {
  BodyMd, BodySm, Typography,
} from '@components/common/Typography';
import useAuth          from '../hooks/useAuth';
import useTheme         from '@hooks/useTheme';
import type { AuthScreenProps } from '@navigation/types';

// ─── Zod Schema ───────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

type Props = AuthScreenProps<'Login'>;

const LoginScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const {
    login,
    isLoading,
    error,
    isAuthenticated,
    dismissError,
  } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode:          'onTouched',
  });

  // Error from Redux → form error dikhao
  useEffect(() => {
    if (error != null) {
      setError('password', { message: error });
      dismissError();
    }
  }, [error, setError, dismissError]);

  const onSubmit = useCallback(
    async (data: LoginForm): Promise<void> => {
      await login(data);
    },
    [login],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <AuthHeader
            title="Welcome back"
            subtitle="Sign in to continue"
            showBack
            onBack={() => navigation.goBack()}
          />

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(500).springify()}
            style={[styles.form, { gap: spacing[4] }]}
          >
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
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            {/* Forgot Password */}
            <BodySm
              color="link"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'flex-end', marginTop: -spacing[2] }}
            >
              Forgot password?
            </BodySm>

            {/* Sign In Button */}
            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            />

            <Divider label="OR" />

            {/* Google Login — Phase 8 mein implement hoga */}
            <Button
              label="Continue with Google"
              onPress={() => {/* TODO: Google OAuth */}}
              variant="secondary"
              size="lg"
              fullWidth
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(500)}
            style={[styles.footer, { gap: spacing[1] }]}
          >
            <BodyMd color="secondary" align="center">
              Don't have an account?{' '}
              <BodyMd
                color="link"
                onPress={() => navigation.navigate('Register')}
                style={{ fontWeight: '600' }}
              >
                Sign up free
              </BodyMd>
            </BodyMd>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  footer: {
    marginTop:         32,
    paddingHorizontal: 20,
    alignItems:        'center',
  } as ViewStyle,
  form: {
    paddingHorizontal: 20,
    marginTop:         24,
  } as ViewStyle,
  screen: {
    flex: 1,
  } as ViewStyle,
  scroll: {
    flexGrow:          1,
    paddingBottom:     40,
  } as ViewStyle,
});

export { LoginScreen };