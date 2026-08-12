import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography }        from '@components/common/Typography';
import useTheme              from '@hooks/useTheme';

interface AuthHeaderProps {
  title?:      string;
  subtitle?:   string;
  showBack?:   boolean;
  onBack?:     () => void;
  rightElement?: React.ReactNode;
}

const AuthHeader = ({
  title,
  subtitle,
  showBack    = false,
  onBack,
  rightElement,
}: AuthHeaderProps): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing[3] },
      ]}
    >
      {/* Back Button Row */}
      <View style={styles.row}>
        {showBack && onBack != null ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.bg.elevated,
                borderColor:     colors.border.default,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Typography variant="bodyLg" color="secondary">←</Typography>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Right element */}
        {rightElement != null ? rightElement : <View style={styles.backPlaceholder} />}
      </View>

      {/* Title + Subtitle */}
      {title != null && (
        <View style={[styles.titleBlock, { marginTop: spacing[4] }]}>
          <Typography variant="h2" color="primary">
            {title}
          </Typography>
          {subtitle != null && (
            <Typography
              variant="bodyMd"
              color="secondary"
              style={{ marginTop: spacing[1.5] }}
            >
              {subtitle}
            </Typography>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    width:        40,
    height:       40,
    borderRadius: 12,
    borderWidth:  1,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  backPlaceholder: {
    width:  40,
    height: 40,
  } as ViewStyle,
  container: {
    paddingHorizontal: 20,
    paddingBottom:     8,
  } as ViewStyle,
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  } as ViewStyle,
  titleBlock: {
    gap: 4,
  } as ViewStyle,
});

export { AuthHeader };