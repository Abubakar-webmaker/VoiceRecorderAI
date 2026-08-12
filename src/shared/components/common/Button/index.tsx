import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import useTheme from '@hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label:      string;
  onPress:    () => void;
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?:     ViewStyle;
  textStyle?: TextStyle;
  haptic?:    boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Button = ({
  label,
  onPress,
  variant    = 'primary',
  size       = 'md',
  isLoading  = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth  = false,
  style,
  textStyle,
  haptic     = true,
}: ButtonProps): React.JSX.Element => {
  const { colors, spacing, borderRadius, textStyles, componentSize } = useTheme();

  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  const handlePressIn = useCallback((): void => {
    scale.value   = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.85, { duration: 80 });
  }, [opacity, scale]);

  const handlePressOut = useCallback((): void => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  }, [opacity, scale]);

  const handlePress = useCallback((): void => {
    if (isDisabled || isLoading) return;
    if (haptic) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }
    onPress();
  }, [haptic, isDisabled, isLoading, onPress]);

  // ─── Variant Styles ─────────────────────────────────────────
  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: isDisabled ? `${colors.primary.default}50` : colors.primary.default,
      },
      text: { color: '#FFFFFF' },
    },
    secondary: {
      container: {
        backgroundColor: colors.bg.elevated,
        borderWidth:     1,
        borderColor:     colors.border.default,
      },
      text: { color: colors.text.primary },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth:     1.5,
        borderColor:     isDisabled
          ? `${colors.primary.default}40`
          : colors.primary.default,
      },
      text: {
        color: isDisabled ? `${colors.primary.default}50` : colors.primary.default,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      text: {
        color: isDisabled ? colors.text.disabled : colors.text.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: isDisabled
          ? `${colors.recording.default}50`
          : colors.recording.default,
      },
      text: { color: '#FFFFFF' },
    },
    ai: {
      container: {
        backgroundColor: isDisabled
          ? `${colors.ai.default}50`
          : colors.ai.surface,
        borderWidth:  1,
        borderColor:  isDisabled ? 'transparent' : `${colors.ai.default}40`,
      },
      text: {
        color: isDisabled ? colors.text.disabled : colors.ai.default,
      },
    },
  };

  // ─── Size Styles ─────────────────────────────────────────────
  const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
    sm: {
      container: {
        height:        componentSize.inputSm,
        paddingHorizontal: spacing[3],
        borderRadius:  borderRadius.md,
        gap:           spacing[1.5],
      },
      text:     textStyles.buttonSm,
      iconSize: 14,
    },
    md: {
      container: {
        height:        componentSize.inputMd,
        paddingHorizontal: spacing[5],
        borderRadius:  borderRadius.lg,
        gap:           spacing[2],
      },
      text:     textStyles.buttonMd,
      iconSize: 18,
    },
    lg: {
      container: {
        height:        componentSize.inputLg,
        paddingHorizontal: spacing[6],
        borderRadius:  borderRadius.xl,
        gap:           spacing[2.5],
      },
      text:     textStyles.buttonLg,
      iconSize: 20,
    },
  };

  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled || isLoading}
      activeOpacity={1}
      style={[
        styles.base,
        sStyle.container,
        vStyle.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled || isLoading, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ai' ? colors.ai.default : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon !== undefined && leftIcon !== null && leftIcon}
          <Text style={[sStyle.text, vStyle.text, textStyle]}>
            {label}
          </Text>
          {rightIcon !== undefined && rightIcon !== null && rightIcon}
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  } as ViewStyle,
  fullWidth: {
    alignSelf: 'stretch',
  } as ViewStyle,
});

export { Button };