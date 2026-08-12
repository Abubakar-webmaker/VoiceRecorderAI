import React from 'react';
import {
  View,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import useTheme from '@hooks/useTheme';

type CardVariant = 'filled' | 'outlined' | 'elevated';

interface CardProps {
  children:  React.ReactNode;
  variant?:  CardVariant;
  onPress?:  () => void;
  style?:    ViewStyle;
  padding?:  number;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Card = ({
  children,
  variant  = 'filled',
  onPress,
  style,
  padding,
  disabled = false,
}: CardProps): React.JSX.Element => {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variantStyles: Record<CardVariant, ViewStyle> = {
    filled: {
      backgroundColor: colors.card,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth:     1,
      borderColor:     colors.border.default,
    },
    elevated: {
      backgroundColor: colors.bg.elevated,
      ...shadows.md,
    },
  };

  const cardStyle: ViewStyle = {
    ...variantStyles[variant],
    borderRadius: borderRadius.xl,
    padding:      padding ?? spacing[4],
    overflow:     'hidden',
  };

  if (onPress !== undefined && onPress !== null) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }}
        disabled={disabled}
        activeOpacity={1}
        style={[cardStyle, animatedStyle, style]}
        accessibilityRole="button"
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

export { Card };