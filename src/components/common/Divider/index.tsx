import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import useTheme from '@hooks/useTheme';

interface DividerProps {
  label?:     string;
  style?:     ViewStyle;
  color?:     string;
  thickness?: number;
  spacing?:   number;
}

const Divider = ({
  label,
  style,
  color,
  thickness = 1,
  spacing: spacingProp,
}: DividerProps): React.JSX.Element => {
  const { colors, spacing, textStyles } = useTheme();

  const lineColor     = color ?? colors.border.default;
  const verticalSpace = spacingProp ?? spacing[4];

  if (label != null) {
    return (
      <View
        style={[
          styles.container,
          { marginVertical: verticalSpace },
          style,
        ]}
      >
        <View style={[styles.line, { backgroundColor: lineColor, height: thickness }]} />
        <Text
          style={[
            textStyles.caption,
            { color: colors.text.tertiary, marginHorizontal: spacing[3] },
          ]}
        >
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: lineColor, height: thickness }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          height:          thickness,
          backgroundColor: lineColor,
          marginVertical:  verticalSpace,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
  } as ViewStyle,
  line: {
    flex: 1,
  } as ViewStyle,
});

export { Divider };