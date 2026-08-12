import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'AIVoiceRecorder';

// ─── Store Refresh Token ──────────────────────────────────────────
export const storeRefreshToken = async (
  email:        string,
  refreshToken: string,
): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword(
      email,          // username field mein email store
      refreshToken,   // password field mein refresh token
      {
        service:     KEYCHAIN_SERVICE,
        accessible:  Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK, // Background refresh ke liye
        accessGroup: undefined,
      },
    );
    return true;
  } catch (error) {
    console.warn('[Keychain] Store failed:', error);
    return false;
  }
};

// ─── Get Refresh Token ────────────────────────────────────────────
export const getRefreshToken = async (): Promise<{
  email:        string;
  refreshToken: string;
} | null> => {
  try {
    const result = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (result === false) return null;

    return {
      email:        result.username,
      refreshToken: result.password,
    };
  } catch (error) {
    console.warn('[Keychain] Get failed:', error);
    return null;
  }
};

// ─── Clear Tokens ─────────────────────────────────────────────────
export const clearRefreshToken = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch (error) {
    console.warn('[Keychain] Clear failed:', error);
  }
};

// ─── Check if token exists ────────────────────────────────────────
export const hasStoredToken = async (): Promise<boolean> => {
  const result = await getRefreshToken();
  return result !== null;
};