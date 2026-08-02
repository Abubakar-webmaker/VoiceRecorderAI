import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import { WelcomeScreen }         from '@features/auth/screens/WelcomeScreen';
import { LoginScreen }           from '@features/auth/screens/LoginScreen';
import { RegisterScreen }        from '@features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen }  from '@features/auth/screens/ForgotPasswordScreen';
import { VerifyEmailScreen }     from '@features/auth/screens/VerifyEmailScreen';
import { ResetPasswordScreen }   from '@features/auth/screens/ResetPasswordScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = (): React.JSX.Element => {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown:       false,
        animation:         'slide_from_right',
        animationDuration: 250,
        contentStyle:      { backgroundColor: '#080B14' },
        gestureEnabled:    true,
      }}
    >
      <AuthStack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <AuthStack.Screen name="Login"          component={LoginScreen} />
      <AuthStack.Screen name="Register"       component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ gestureEnabled: false }}
      />
      <AuthStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ gestureEnabled: false }}
      />
    </AuthStack.Navigator>
  );
};

export { AuthNavigator };
