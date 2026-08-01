import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider }          from 'react-redux';
import { PersistGate }       from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }  from 'react-native-safe-area-context';

import { store, persistor }  from '@store/index';
import { AppNavigator }      from '@navigation/AppNavigator';
import { Loader }            from '@components/common/Loader';
import { colors }            from '@theme/index';
import { setupPlayer }       from '@services/audio/player.service';

if (__DEV__) {
  LogBox.ignoreLogs([
    'ViewPropTypes',
    'Non-serializable values were found',
    'ReactNativeFiberHostComponent',
  ]);
}

const App = (): React.JSX.Element => {
  // TrackPlayer initialize karo once
  useEffect(() => {
    void setupPlayer();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate
          loading={
            <Loader fullScreen variant="pulse" color={colors.primary.default} />
          }
          persistor={persistor}
        >
          <SafeAreaProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />
            <AppNavigator />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;