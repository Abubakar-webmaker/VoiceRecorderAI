import { apiClient }  from '@api/axios.instance';
import { ENDPOINTS }  from '@api/endpoints';
import type {
  Recording,
  RecordingQueryParams,
  SearchQueryParams,
  DownloadUrlResult,
  ShareResult,
  PaginationInfo,
} from '@types/recording.types';
import type { ApiResponse } from '@types/api.types';

// ─── Upload Recording ─────────────────────────────────────────────
export const uploadRecordingApi = async (
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<Recording> => {
  const response = await apiClient.post<ApiResponse<Recording>>(
    ENDPOINTS.RECORDINGS.BASE,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total != null && onProgress != null) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    },
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Get All Recordings ───────────────────────────────────────────
export const getRecordingsApi = async (
  params: RecordingQueryParams = {},
): Promise<{ recordings: Recording[]; pagination: PaginationInfo }> => {
  const query: Record<string, string> = {};
  if (params.page     != null)  query['page']      = String(params.page);
  if (params.limit    != null)  query['limit']     = String(params.limit);
  if (params.sortBy   != null)  query['sortBy']    = params.sortBy;
  if (params.sortOrder != null) query['sortOrder'] = params.sortOrder;
  if (params.folderId !== undefined) {
    query['folderId'] = params.folderId === null ? 'null' : params.folderId;
  }
  if (params.tags       != null) query['tags']       = params.tags;
  if (params.isFavorite != null) query['isFavorite'] = String(params.isFavorite);

  const response = await apiClient.get<
    ApiResponse<{ recordings: Recording[]; pagination: PaginationInfo }>
  >(ENDPOINTS.RECORDINGS.BASE, { params: query });

  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Get Single Recording ─────────────────────────────────────────
export const getRecordingByIdApi = async (id: string): Promise<Recording> => {
  const response = await apiClient.get<ApiResponse<Recording>>(
    ENDPOINTS.RECORDINGS.DETAIL(id),
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Get Waveform ─────────────────────────────────────────────────
export const getWaveformApi = async (id: string): Promise<number[]> => {
  const response = await apiClient.get<ApiResponse<{ waveform: number[] }>>(
    ENDPOINTS.RECORDINGS.WAVEFORM(id),
  );
  return response.data.data?.waveform ?? [];
};

// ─── Get Favorites ────────────────────────────────────────────────
export const getFavoritesApi = async (
  page = 1,
  limit = 20,
): Promise<{ recordings: Recording[]; total: number }> => {
  const response = await apiClient.get<
    ApiResponse<{ recordings: Recording[]; total: number }>
  >(ENDPOINTS.RECORDINGS.FAVORITES, { params: { page, limit } });

  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Search ───────────────────────────────────────────────────────
export const searchRecordingsApi = async (
  params: SearchQueryParams,
): Promise<{ recordings: Recording[]; total: number }> => {
  const response = await apiClient.get<
    ApiResponse<{ recordings: Recording[]; total: number }>
  >(ENDPOINTS.RECORDINGS.SEARCH, { params });

  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Update Recording ─────────────────────────────────────────────
export const updateRecordingApi = async (
  id:      string,
  payload: Partial<{ title: string; description: string; tags: string[]; folderId: string | null }>,
): Promise<Recording> => {
  const response = await apiClient.put<ApiResponse<Recording>>(
    ENDPOINTS.RECORDINGS.DETAIL(id),
    payload,
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Toggle Favorite ──────────────────────────────────────────────
export const toggleFavoriteApi = async (
  id: string,
): Promise<{ isFavorite: boolean }> => {
  const response = await apiClient.patch<
    ApiResponse<{ isFavorite: boolean }>
  >(ENDPOINTS.RECORDINGS.FAVORITE(id));

  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Move Recording ───────────────────────────────────────────────
export const moveRecordingApi = async (
  id:       string,
  folderId: string | null,
): Promise<Recording> => {
  const response = await apiClient.patch<ApiResponse<Recording>>(
    ENDPOINTS.RECORDINGS.MOVE(id),
    { folderId },
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Increment Play Count ─────────────────────────────────────────
export const incrementPlayApi = async (id: string): Promise<void> => {
  await apiClient.patch(ENDPOINTS.RECORDINGS.PLAY(id));
};

// ─── Get Download URL ─────────────────────────────────────────────
export const getDownloadUrlApi = async (id: string): Promise<DownloadUrlResult> => {
  const response = await apiClient.get<ApiResponse<DownloadUrlResult>>(
    ENDPOINTS.RECORDINGS.DOWNLOAD(id),
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Generate Share Link ──────────────────────────────────────────
export const generateShareLinkApi = async (
  id:             string,
  expiresInHours = 24,
): Promise<ShareResult> => {
  const response = await apiClient.post<ApiResponse<ShareResult>>(
    ENDPOINTS.RECORDINGS.SHARE(id),
    { expiresInHours },
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Delete Recording ─────────────────────────────────────────────
export const deleteRecordingApi = async (id: string): Promise<void> => {
  await apiClient.delete(ENDPOINTS.RECORDINGS.DETAIL(id));
};

// ─── Bulk Delete ──────────────────────────────────────────────────
export const bulkDeleteApi = async (
  recordingIds: string[],
): Promise<{ deleted: number; failed: number }> => {
  const response = await apiClient.post<
    ApiResponse<{ deleted: number; failed: number }>
  >(ENDPOINTS.RECORDINGS.BULK_DELETE, { recordingIds });
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};