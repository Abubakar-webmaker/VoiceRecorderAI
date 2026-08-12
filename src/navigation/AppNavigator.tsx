import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';

import type { RootStackParamList } from './types';
import { navigationRef } from './utils';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Loader } from '@components/common/Loader';
import { initializeAuth } from '@features/auth/store/authSlice';
import type { RootState, AppDispatch } from '@store/index';
import { AIScreen } from '@features/ai/screens/AIScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = (): React.JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    void dispatch(initializeAuth());
  }, [dispatch]);

  if (!isInitialized) {
    return <Loader fullScreen variant="pulse" />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={AuthNavigator} />
        )}
        <RootStack.Screen
          name="AIScreen"
          component={AIScreen}
          options={{
            presentation:   'modal',
            animation:      'slide_from_bottom',
            headerShown:    false,
            gestureEnabled: true,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export { AppNavigator };
