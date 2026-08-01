import { configureStore }        from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from 'redux-persist';
import AsyncStorage              from '@react-native-async-storage/async-storage';

import rootReducer               from './rootReducer';
import { injectInterceptorDeps } from '@services/api/axios.instance';
import { setAccessToken, forceLogout } from '@features/auth/store/authSlice';
import { AppRegistry }   from 'react-native';
import App               from './App';
import { name as appName } from './app.json';
import TrackPlayer       from 'react-native-track-player';
import { PlaybackService } from './src/services/audio/playback.service';

AppRegistry.registerComponent(appName, () => App);

// TrackPlayer background service register karo
TrackPlayer.registerPlaybackService(() => PlaybackService);

const persistConfig = {
  key:       'root',
  version:   1,
  storage:   AsyncStorage,
  whitelist: ['auth'],        // Sirf auth persist karo
  blacklist: ['recording', 'player', 'ai'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Interceptors ke liye store access inject karo
injectInterceptorDeps({
  getAccessToken: () =>
    (store.getState() as ReturnType<typeof store.getState>).auth?.accessToken ?? null,
  onTokenRefreshed: (token: string) => {
    store.dispatch(setAccessToken(token));
  },
  onAuthError: () => {
    store.dispatch(forceLogout());
  },
});

export type RootState    = ReturnType<typeof store.getState>;
export type AppDispatch  = typeof store.dispatch;