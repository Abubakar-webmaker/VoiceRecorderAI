import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import useTheme from '@hooks/useTheme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'ai' | 'neutral';
type BadgeSize    = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label:    string;
  variant?: BadgeVariant;
  size?:    BadgeSize;
  dot?:     boolean;  // Show dot only, no text
  style?:   ViewStyle;
}

const Badge = ({
  label,
  variant = 'primary',
  size    = 'md',
  dot     = false,
  style,
}: BadgeProps): React.JSX.Element => {
  const { colors, spacing, borderRadius, textStyles } = useTheme();

  const variantMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    primary: {
      bg:     colors.primary.surface,
      text:   colors.primary.light,
      border: `${colors.primary.default}30`,
    },
    success: {
      bg:     colors.success.surface,
      text:   colors.success.text,
      border: `${colors.ai.default}30`,
    },
    warning: {
      bg:     colors.warning.surface,
      text:   colors.warning.text,
      border: `${colors.warning.default}30`,
    },
    error: {
      bg:     colors.error.surface,
      text:   colors.error.text,
      border: `${colors.error.default}30`,
    },
    ai: {
      bg:     colors.ai.surface,
      text:   colors.ai.light,
      border: `${colors.ai.default}30`,
    },
    neutral: {
      bg:     colors.bg.elevated,
      text:   colors.text.secondary,
      border: colors.border.default,
    },
  };

  const sizeMap: Record<BadgeSize, { px: number; py: number; dotSize: number }> = {
    sm: { px: spacing[1.5], py: spacing[0.5], dotSize: 6 },
    md: { px: spacing[2],   py: spacing[1],   dotSize: 8 },
    lg: { px: spacing[3],   py: spacing[1.5], dotSize: 10 },
  };

  const v = variantMap[variant];
  const s = sizeMap[size];

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            width:        s.dotSize,
            height:       s.dotSize,
            borderRadius: s.dotSize / 2,
            backgroundColor: v.text,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:  v.bg,
          paddingHorizontal: s.px,
          paddingVertical:  s.py,
          borderColor:      v.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          textStyles.labelSm,
          { color: v.text },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf:        'flex-start',
    borderRadius:     9999, // default to large value
    borderWidth:      1,
  },
  dot: {
    // sizing handled by inline for dynamic dotSize
  }
});

export { Badge };