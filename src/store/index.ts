import { configureStore }        from '@reduxjs/toolkit';
import {
  persistStore, persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from 'redux-persist';
import AsyncStorage              from '@react-native-async-storage/async-storage';
import rootReducer               from './rootReducer';
import { injectInterceptorDeps } from '@services/api/axios.instance';
import { setAccessToken, forceLogout } from '@features/auth/store/authSlice';

const persistConfig = {
  key:       'root',
  version:   2,
  storage:   AsyncStorage,
  whitelist: ['auth', 'settings', 'theme'],
  blacklist: ['recording', 'recorder', 'player', 'ai', 'offlineQueue'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer:    persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

injectInterceptorDeps({
  getAccessToken: () =>
    (store.getState() as ReturnType<typeof store.getState>).auth?.accessToken ?? null,
  onTokenRefreshed: (token: string) => store.dispatch(setAccessToken(token)),
  onAuthError: ()   => store.dispatch(forceLogout()),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;