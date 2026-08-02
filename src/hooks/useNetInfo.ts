import { useEffect, useState, useCallback } from 'react';
import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo';

export interface NetInfoResult {
  isConnected:   boolean;
  isWifi:        boolean;
  isCellular:    boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

const mapState = (state: NetInfoState): NetInfoResult => ({
  isConnected:         state.isConnected ?? false,
  isWifi:              state.type === 'wifi',
  isCellular:          state.type === 'cellular',
  isInternetReachable: state.isInternetReachable,
  connectionType:      state.type,
});

const useNetInfo = (): NetInfoResult & {
  checkConnection: () => Promise<boolean>;
} => {
  const [netInfo, setNetInfo] = useState<NetInfoResult>({
    isConnected:         true,
    isWifi:              false,
    isCellular:          false,
    isInternetReachable: null,
    connectionType:      'unknown',
  });

  useEffect(() => {
    let sub: NetInfoSubscription;

    // Get initial state
    void NetInfo.fetch().then((state) => {
      setNetInfo(mapState(state));
    });

    // Subscribe to changes
    sub = NetInfo.addEventListener((state) => {
      setNetInfo(mapState(state));
    });

    return () => { sub?.(); };
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    const result = mapState(state);
    setNetInfo(result);
    return result.isConnected && result.isInternetReachable !== false;
  }, []);

  return { ...netInfo, checkConnection };
};

export default useNetInfo;