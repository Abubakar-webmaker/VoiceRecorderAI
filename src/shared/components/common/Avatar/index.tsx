import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import useTheme from '@hooks/useTheme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?:   string;
  uri?:    string;
  size?:   AvatarSize;
  style?:  ViewStyle;
  showBorder?: boolean;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? '?';
  return (
    (parts[0]?.charAt(0) ?? '') +
    (parts[parts.length - 1]?.charAt(0) ?? '')
  ).toUpperCase();
};

const GRADIENT_COLORS = [
  ['#6366F1', '#8B5CF6'],
  ['#FF6B6B', '#FF8E8E'],
  ['#4ECDC4', '#45B7D1'],
  ['#F59E0B', '#FCD34D'],
  ['#10B981', '#34D399'],
];

const getColorPair = (name: string): [string, string] => {
  const idx = name.charCodeAt(0) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[idx] as [string, string];
};

const Avatar = ({
  name        = 'User',
  uri,
  size        = 'md',
  style,
  showBorder  = false,
}: AvatarProps): React.JSX.Element => {
  const { colors, componentSize, textStyles } = useTheme();
  const [imgError, setImgError] = useState(false);

  const sizePx = {
    xs: componentSize.avatarXs,
    sm: componentSize.avatarSm,
    md: componentSize.avatarMd,
    lg: componentSize.avatarLg,
    xl: componentSize.avatarXl,
  }[size];

  const fontSizeMap = {
    xs: textStyles.labelSm.fontSize,
    sm: textStyles.label.fontSize,
    md: textStyles.bodyMd.fontSize,
    lg: textStyles.h4.fontSize,
    xl: textStyles.h2.fontSize,
  }[size];

  const [bgColor] = getColorPair(name);
  const initials  = getInitials(name);
  const showImage = uri !== undefined && uri !== null && !imgError;

  return (
    <View
      style={[
        styles.container,
        {
          width:           sizePx,
          height:          sizePx,
          borderRadius:    sizePx / 2,
          backgroundColor: bgColor,
        },
        showBorder && styles.border,
        showBorder && { borderColor: colors.border.focus },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: sizePx, height: sizePx }}
          onError={() => setImgError(true)}
          resizeMode="cover"
          accessibilityLabel={`${name} avatar`}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: fontSizeMap }
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  border: {
    borderWidth: 2,
  },
  container: {
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

export { Avatar };