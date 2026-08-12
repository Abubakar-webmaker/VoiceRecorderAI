import React from 'react';
import { Text, type TextStyle } from 'react-native';
import useTheme from '@hooks/useTheme';
import type { AppTheme } from '@theme/index';

type TextStyleKey = keyof AppTheme['textStyles'];
type ColorKey     = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'link' | 'inverse';

interface TypographyProps {
  children:    React.ReactNode;
  variant?:    TextStyleKey;
  color?:      ColorKey | (string & Record<never, never>); // preset ya custom hex
  align?:      'left' | 'center' | 'right';
  numberOfLines?: number;
  style?:      TextStyle;
  onPress?:    () => void;
}

const Typography = ({
  children,
  variant  = 'bodyMd',
  color    = 'primary',
  align    = 'left',
  numberOfLines,
  style,
  onPress,
}: TypographyProps): React.JSX.Element => {
  const { colors, textStyles } = useTheme();

  const presetColors: Record<ColorKey, string> = {
    primary:   colors.text.primary,
    secondary: colors.text.secondary,
    tertiary:  colors.text.tertiary,
    disabled:  colors.text.disabled,
    link:      colors.text.link,
    inverse:   colors.text.inverse,
  };

  const resolvedColor =
    color in presetColors
      ? presetColors[color as ColorKey]
      : color;

  return (
    <Text
      onPress={onPress}
      numberOfLines={numberOfLines}
      style={[
        textStyles[variant],
        {
          color:     resolvedColor,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// ─── Convenience Wrappers ─────────────────────────────────────────
const H1 = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="h1" />;
const H2 = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="h2" />;
const H3 = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="h3" />;
const H4 = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="h4" />;
const H5 = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="h5" />;
const BodyLg = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="bodyLg" />;
const BodyMd = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="bodyMd" />;
const BodySm = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="bodySm" />;
const Caption = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="caption" />;
const Label = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="label" />;
const MonoText = (p: Omit<TypographyProps, 'variant'>): React.JSX.Element =>
  <Typography {...p} variant="mono" />;

export { Typography, H1, H2, H3, H4, H5, BodyLg, BodyMd, BodySm, Caption, Label, MonoText };