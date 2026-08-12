import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '@theme/index';

// Temporary screen — real screens Phase 7+ mein replace honge
const PlaceholderScreen = (): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎙️</Text>
      <Text style={styles.label}>AI Voice Recorder</Text>
      <Text style={styles.sub}>Coming in next phase...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems:      'center',
    backgroundColor: colors.bg.primary,
    flex:            1,
    gap:             12,
    justifyContent:  'center',
  },
  label: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  sub: {
    ...textStyles.bodyMd,
    color: colors.text.secondary,
  },
  text: {
    fontSize: 48,
  },
});

export { PlaceholderScreen };