import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import useTheme from '@hooks/useTheme';
import { Typography } from '@components/common/Typography';
import { Button }     from '@components/common/Button';

interface EmptyStateProps {
  icon:         string;
  title:        string;
  description:  string;
  actionLabel?: string;
  onAction?:   () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?:   () => void;
  style?:       ViewStyle;
}

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps): React.JSX.Element => {
  const { colors, borderRadius } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Icon container — soft glow background */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.primary.surface,
            borderRadius:    borderRadius['3xl'],
          },
        ]}
      >
        <Typography variant="displaySm" align="center">
          {icon}
        </Typography>
      </View>

      <Typography variant="h4" align="center" color="primary">
        {title}
      </Typography>

      <Typography
        variant="bodyMd"
        align="center"
        color="secondary"
        style={styles.description}
      >
        {description}
      </Typography>

      {actionLabel !== undefined && actionLabel !== null && onAction !== undefined && onAction !== null && (
        <View style={styles.actions}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
          {secondaryActionLabel !== undefined && secondaryActionLabel !== null && onSecondaryAction !== undefined && onSecondaryAction !== null && (
            <Button
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              size="md"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap:       10,
    marginTop: 8,
    width:     '100%',
    alignItems: 'center',
  } as ViewStyle,
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            16,
    paddingHorizontal: 32,
  } as ViewStyle,
  description: {
    maxWidth: 260
  } as ViewStyle,
  iconContainer: {
    padding:      24,
    marginBottom: 8,
  } as ViewStyle,
});

export { EmptyState };