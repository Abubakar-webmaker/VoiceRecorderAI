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
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { AuthHeader }  from '../components/AuthHeader';
import { Button }      from '@components/common/Button';
import { Input }       from '@components/common/Input';
import { BodyMd, BodySm, H3, Typography } from '@components/common/Typography';
import { Card }        from '@components/common/Card';
import useAuth         from '../hooks/useAuth';
import useTheme        from '@hooks/useTheme';
import type { AuthScreenProps } from '@navigation/types';

const forgotSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
});
type ForgotForm = z.infer<typeof forgotSchema>;

type Props = AuthScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const {
    forgotPassword,
    isLoading,
    error,
    successMessage,
    dismissError,
    dismissSuccess,
  } = useAuth();

  const successScale = useSharedValue(0);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity:   successScale.value,
  }));

  const [submitted, setSubmitted] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState('');

  const {
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver:      zodResolver(forgotSchema),
    defaultValues: { email: '' },
    mode:          'onTouched',
  });

  useEffect(() => {
    if (error != null) {
      setError('email', { message: error });
      dismissError();
    }
  }, [error, setError, dismissError]);

  useEffect(() => {
    if (successMessage != null) {
      setSubmitted(true);
      successScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      dismissSuccess();
    }
  }, [successMessage, successScale, dismissSuccess]);

  const onSubmit = useCallback(
    async (data: ForgotForm): Promise<void> => {
      setSentEmail(data.email);
      await forgotPassword(data);
    },
    [forgotPassword],
  );

  // Success state
  if (submitted) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.bg.primary }]}
        edges={['top', 'bottom']}
      >
        <AuthHeader showBack onBack={() => navigation.goBack()} />

        <Animated.View
          style={[styles.successContainer, successStyle]}
        >
          <View
            style={[
              styles.successIcon,
              { backgroundColor: colors.ai.surface },
            ]}
          >
            <Typography variant="displaySm" align="center">📧</Typography>
          </View>

          <H3 align="center" color="primary">Check your inbox</H3>

          <BodyMd color="secondary" align="center">
            We sent a password reset link to{'\n'}
            <BodyMd color="primary" style={{ fontWeight: '600' }}>
              {sentEmail}
            </BodyMd>
          </BodyMd>

          <Card
            variant="outlined"
            style={{ width: '100%' }}
          >
            <BodySm color="secondary">
              ⏰ The link expires in 1 hour. Check your spam folder if you don't see it.
            </BodySm>
          </Card>

          <Button
            label="Resend Email"
            onPress={handleSubmit(onSubmit)}
            variant="ghost"
            size="md"
            isLoading={isLoading}
          />

          <Button
            label="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            size="md"
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

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
            title="Reset password"
            subtitle="Enter your email and we'll send you a reset link"
            showBack
            onBack={() => navigation.goBack()}
          />

          <Animated.View
            entering={FadeInDown.delay(150).duration(500).springify()}
            style={[styles.form, { gap: spacing[4] }]}
          >
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <Button
              label="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            />

            <Button
              label="Back to Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="ghost"
              size="md"
              fullWidth
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  form:             { paddingHorizontal: 20, marginTop: 24 } as ViewStyle,
  screen:           { flex: 1 } as ViewStyle,
  scroll:           { flexGrow: 1, paddingBottom: 40 } as ViewStyle,
  successContainer: {
    flex:              1,
    paddingHorizontal: 24,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               20,
  } as ViewStyle,
  successIcon: {
    padding:      24,
    borderRadius: 24,
    marginBottom: 8,
  } as ViewStyle,
});

export { ForgotPasswordScreen };