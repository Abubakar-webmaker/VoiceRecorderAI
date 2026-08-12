import React, { useCallback, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { BodyMd }      from '@components/common/Typography';
import useAuth         from '../hooks/useAuth';
import useTheme        from '@hooks/useTheme';
import type { AuthScreenProps } from '@navigation/types';

const resetSchema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

type Props = AuthScreenProps<'ResetPassword'>;

const ResetPasswordScreen = ({ navigation, route }: Props): React.JSX.Element => {
  const { token } = route.params;
  const { colors, spacing } = useTheme();
  const {
    resetPassword,
    isLoading,
    error,
    successMessage,
    dismissError,
    dismissSuccess,
  } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver:      zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode:          'onTouched',
  });

  useEffect(() => {
    if (error != null) {
      setError('confirmPassword', { message: error });
      dismissError();
    }
  }, [error, setError, dismissError]);

  useEffect(() => {
    if (successMessage != null) {
      dismissSuccess();
      navigation.navigate('Login');
    }
  }, [successMessage, dismissSuccess, navigation]);

  const onSubmit = useCallback(
    async (data: ResetForm): Promise<void> => {
      await resetPassword({ token, password: data.password });
    },
    [resetPassword, token],
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
        >
          <AuthHeader
            title="New password"
            subtitle="Choose a strong password for your account"
            showBack
            onBack={() => navigation.goBack()}
          />

          <Animated.View
            entering={FadeInDown.delay(150).duration(500).springify()}
            style={[styles.form, { gap: spacing[4] }]}
          >
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                  textContentType="newPassword"
                  returnKeyType="next"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your new password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  isPassword
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <Button
              label="Reset Password"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            />

            <BodyMd color="secondary" align="center">
              Remember your password?{' '}
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
  form:    { paddingHorizontal: 20, marginTop: 24 } as ViewStyle,
  screen:  { flex: 1 } as ViewStyle,
  scroll:  { flexGrow: 1, paddingBottom: 40 } as ViewStyle,
});

export { ResetPasswordScreen };
