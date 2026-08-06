import React, { useEffect } from 'react';
import {
  StatusBar, LogBox, Appearance, useColorScheme,
} from 'react-native';
import { Provider }          from 'react-redux';
import { PersistGate }       from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }  from 'react-native-safe-area-context';
import NetInfo               from '@react-native-community/netinfo';

import '@core/localization/i18n';
import { store, persistor }  from '@store/index';
import { AppNavigator }      from '@navigation/AppNavigator';
import { Loader }            from '@components/common/Loader';
import { ErrorBoundary }     from '@components/ErrorBoundary';
import { colors }            from '@theme/index';
import { setupPlayer }       from '@services/audio/player.service';
import {
  setupNotificationChannels,
  setupBackgroundMessageHandler,
  setupForegroundMessageHandler,
  getFCMToken,
} from '@services/notification/notification.service';
import {
  connectSocket,
  disconnectSocket,
  updateSocketToken,
} from '@services/socket/socket.service';
import { syncSystemTheme }   from '@features/settings/store/themeSlice';
import {
  loadQueueThunk,
  processQueueThunk,
} from '@features/recording/store/offlineQueueSlice';
import { updateProfileApi }  from '@features/auth/services/auth.api';

if (__DEV__) {
  LogBox.ignoreLogs([
    'ViewPropTypes',
    'Non-serializable values',
    'ReactNativeFiberHostComponent',
  ]);
}

// ─── Background message handler (must be outside component) ───────
setupBackgroundMessageHandler();

// ─── Register FCM token with backend ─────────────────────────────
const registerFCMToken = async (): Promise<void> => {
  try {
    const token = await getFCMToken();
    if (token != null) {
      await updateProfileApi({ fcmToken: token });
    }
  } catch {
    // Non-critical — silent fail
  }
};

// ─── App Content (needs store access) ────────────────────────────
const AppContent = (): React.JSX.Element => {
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

    // 6. Monitor network — process queue + connect socket when online
    const unsubNet = NetInfo.addEventListener((netState) => {
      if (netState.isConnected && netState.isInternetReachable !== false) {
        void store.dispatch(processQueueThunk());

        // Reconnect socket if we have an access token
        const accessToken = (store.getState() as ReturnType<typeof store.getState>).auth?.accessToken;
        if (accessToken != null) {
          updateSocketToken(accessToken);
        }
      }
    });

    // 7. Listen for system theme changes
    const themeSub = Appearance.addChangeListener(() => {
      store.dispatch(syncSystemTheme());
    });

    // 8. Connect socket if already authenticated
    const authState = (store.getState() as ReturnType<typeof store.getState>).auth;
    if (authState?.isAuthenticated && authState.accessToken != null) {
      connectSocket(authState.accessToken);
      void registerFCMToken();
    }

    // 9. Subscribe to auth state changes for socket lifecycle
    const unsubStore = store.subscribe(() => {
      const state = store.getState() as ReturnType<typeof store.getState>;
      const { isAuthenticated, accessToken } = state.auth ?? {};

      if (isAuthenticated && accessToken != null) {
        updateSocketToken(accessToken);
      } else if (!isAuthenticated) {
        disconnectSocket();
      }
    });

    return () => {
      unsubForeground?.();
      unsubNet?.();
      themeSub.remove();
      unsubStore();
      disconnectSocket();
    };
  }, []);

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
