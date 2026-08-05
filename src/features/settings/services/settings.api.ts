import { apiClient }    from '@api/axios.instance';
import { ENDPOINTS }    from '@api/endpoints';
import type { ApiResponse } from '@types/api.types';
import type { UserSettings } from '@types/settings.types';

export const getSettingsApi = async (): Promise<UserSettings> => {
  const res = await apiClient.get<ApiResponse<UserSettings>>(
    ENDPOINTS.SETTINGS.BASE,
  );
  return res.data.data ?? ({} as UserSettings);
};

export const updateSettingsApi = async (
  updates: Partial<UserSettings>,
): Promise<UserSettings> => {
  const res = await apiClient.patch<ApiResponse<UserSettings>>(
    ENDPOINTS.SETTINGS.UPDATE,
    updates,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};