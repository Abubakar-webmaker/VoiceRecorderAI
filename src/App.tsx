import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider }         from 'react-redux';
import { PersistGate }      from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }  from 'react-native-safe-area-context';

import { store, persistor }  from '@store/index';
import { AppNavigator }      from '@navigation/AppNavigator';
import { Loader }            from '@components/common/Loader';
import { colors }            from '@theme/index';

// Development mein noisy logs suppress karo
if (__DEV__) {
  LogBox.ignoreLogs([
    'ViewPropTypes',
    'ReactNativeFiberHostComponent',
    'Non-serializable values were found in the navigation state',
  ]);
}

const App = (): React.JSX.Element => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate
          loading={
            <Loader
              fullScreen
              variant="pulse"
              color={colors.primary.default}
            />
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