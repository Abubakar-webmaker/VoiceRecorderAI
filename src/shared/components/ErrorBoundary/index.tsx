import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors }       from '@theme/index';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError:     boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Replace with Sentry.captureException(error) in production
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Text style={styles.emoji}>⚠️</Text>
          </View>

          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error.
          </Text>

          {__DEV__ && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={5}>
                {this.state.errorMessage}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={this.handleReset}
            style={styles.btn}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor:   colors.primary.default,
    paddingHorizontal: 32,
    paddingVertical:   14,
    borderRadius:      14,
    marginTop:         8,
  } as ViewStyle,
  btnText: {
    color:      colors.text.inverse,
    fontSize:   16,
    fontWeight: '600',
  },
  container: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 32,
    gap:               16,
  } as ViewStyle,
  emoji: {
    fontSize: 48,
  },
  errorBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    12,
    padding:         14,
    width:           '100%',
    borderWidth:     1,
    borderColor:     colors.border.default,
  } as ViewStyle,
  errorText: {
    color:      colors.error.light,
    fontFamily: 'monospace',
    fontSize:   12,
  },
  iconWrap: {
    width:          96,
    height:         96,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
    backgroundColor: colors.error.surface,
  } as ViewStyle,
  screen: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  } as ViewStyle,
  subtitle: {
    color:      colors.text.secondary,
    fontSize:   15,
    lineHeight: 22,
    textAlign:  'center',
  },
  title: {
    color:      colors.text.primary,
    fontSize:   24,
    fontWeight: '700',
    textAlign:  'center',
  },
});

export { ErrorBoundary };
