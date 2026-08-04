import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import Config from 'react-native-config';

// ─── Create Instance ──────────────────────────────────────────────
const createAxiosInstance = (): AxiosInstance => {
  const baseURL = Config.API_BASE_URL ?? 'http://10.0.2.2:5000/api/v1';

  const instance = axios.create({
    baseURL,
    timeout:         30_000,
    withCredentials: true,   // Cookies (refreshToken) ke liye
    headers: {
      'Content-Type':     'application/json',
      'Accept':           'application/json',
      'X-App-Version':    Config.APP_VERSION ?? '1.0.0',
      'X-Platform':       'mobile',
    },
  });

  return instance;
};

export const apiClient = createAxiosInstance();

// ─── Token Accessor (circular dependency avoid karne ke liye) ─────
// Store se token access karne ke liye function inject karo
let _getAccessToken: (() => string | null) | null = null;
let _onTokenRefreshed: ((token: string) => void) | null = null;
let _onAuthError: (() => void) | null = null;

export const injectInterceptorDeps = (deps: {
  getAccessToken:   () => string | null;
  onTokenRefreshed: (token: string) => void;
  onAuthError:      () => void;
}): void => {
  _getAccessToken   = deps.getAccessToken;
  _onTokenRefreshed = deps.onTokenRefreshed;
  _onAuthError      = deps.onAuthError;
};

// ─── Request Interceptor ──────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = _getAccessToken?.();
    if (token != null && config.headers != null) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor + Token Refresh ─────────────────────────
let isRefreshing  = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown)  => void;
}> = [];

const processQueue = (error: unknown, token: string | null): void => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error != null) reject(error);
    else if (token != null) resolve(token);
  });
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,

  async (error: AxiosError): Promise<AxiosResponse> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // 401 — token expired, refresh karein
    if (
      status === 401 &&
      originalRequest._retry !== true &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      // Already refreshing? Queue mein add karo
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers != null) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Keychain se refresh token lo
        const { getRefreshToken } = await import('@services/storage/keychain.service');
        const stored = await getRefreshToken();

        if (stored == null) {
          throw new Error('No refresh token stored');
        }

        // New access token lo
        const refreshResponse = await axios.post<{
          success: boolean;
          data: { accessToken: string };
        }>(
          `${apiClient.defaults.baseURL ?? ''}/auth/refresh`,
          { refreshToken: stored.refreshToken },
        );

        const newAccessToken = refreshResponse.data.data?.accessToken;
        if (newAccessToken == null) throw new Error('Invalid refresh response');

        // Redux mein update karo
        _onTokenRefreshed?.(newAccessToken);

        // Queued requests ko process karo
        processQueue(null, newAccessToken);

        // Original request retry karo
        if (originalRequest.headers != null) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        _onAuthError?.(); // Logout karo
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // ─── Error Transform ──────────────────────────────────────
    const apiError = {
      message: (error.response?.data as { message?: string })?.message
        ?? error.message
        ?? 'An unexpected error occurred',
      statusCode: status ?? 0,
      errors: (error.response?.data as { errors?: unknown[] })?.errors ?? [],
      isNetworkError: error.code === 'ECONNABORTED' || !error.response,
    };

    return Promise.reject(apiError);
  },
);