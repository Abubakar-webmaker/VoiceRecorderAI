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
    flex:            1,
    backgroundColor: colors.bg.primary,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             12,
  },
  text: {
    fontSize: 48,
  },
  label: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  sub: {
    ...textStyles.bodyMd,
    color: colors.text.secondary,
  },
});

export { PlaceholderScreen };