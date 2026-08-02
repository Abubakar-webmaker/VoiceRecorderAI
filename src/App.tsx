import React, { useEffect } from 'react';
import {
  StatusBar, LogBox, Appearance, useColorScheme,
} from 'react-native';
import { Provider }          from 'react-redux';
import { PersistGate }       from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }  from 'react-native-safe-area-context';
import NetInfo               from '@react-native-community/netinfo';

import { store, persistor }  from '@store/index';
import { AppNavigator }      from '@navigation/AppNavigator';
import { Loader }            from '@components/common/Loader';
import { colors }            from '@theme/index';
import { setupPlayer }       from '@services/audio/player.service';
import {
  setupNotificationChannels,
  setupBackgroundMessageHandler,
  setupForegroundMessageHandler,
} from '@services/notification/notification.service';
import { syncSystemTheme }   from '@features/settings/store/themeSlice';
import {
  loadQueueThunk,
  processQueueThunk,
} from '@features/recording/store/offlineQueueSlice';

if (__DEV__) {
  LogBox.ignoreLogs([
    'ViewPropTypes',
    'Non-serializable values',
    'ReactNativeFiberHostComponent',
  ]);
}

// ─── Background message handler (must be outside component) ───────
setupBackgroundMessageHandler();

// ─── App Content (needs store access) ────────────────────────────
const AppContent = (): React.JSX.Element => {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 1. Setup audio player
    void setupPlayer();

    // 2. Setup notification channels
    void setupNotificationChannels();

    // 3. Setup foreground notification handler
    const unsubForeground = setupForegroundMessageHandler();

    // 4. Load offline queue
    void store.dispatch(loadQueueThunk());

    // 5. Sync theme with system
    store.dispatch(syncSystemTheme());

    // 6. Monitor network — process queue when online
    const unsubNet = NetInfo.addEventListener((netState) => {
      if (netState.isConnected && netState.isInternetReachable !== false) {
        void store.dispatch(processQueueThunk());
      }
    });

    // 7. Listen for system theme changes
    const themeSub = Appearance.addChangeListener(() => {
      store.dispatch(syncSystemTheme());
    });

    return () => {
      unsubForeground?.();
      unsubNet?.();
      themeSub.remove();
    };
  }, []);

  // Status bar color based on theme
  const isDark = store.getState().theme?.isDark !== false;

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </>
  );
};

// ─── Root App ────────────────────────────────────────────────────
const App = (): React.JSX.Element => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate
          loading={<Loader fullScreen variant="pulse" color={colors.primary.default} />}
          persistor={persistor}
        >
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;