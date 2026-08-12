import { apiClient } from '@api/axios.instance';
import { ENDPOINTS } from '@api/endpoints';
import type { Folder } from '@types/recording.types';
import type { ApiResponse } from '@types/api.types';
import type { Recording } from '@types/recording.types';

// ─── Create Folder ────────────────────────────────────────────────
export const createFolderApi = async (payload: {
  name:         string;
  description?: string;
  parentId?:    string | null;
  color?:       string;
  icon?:        string;
  isPinned?:    boolean;
}): Promise<Folder> => {
  const response = await apiClient.post<ApiResponse<Folder>>(
    ENDPOINTS.FOLDERS.BASE,
    payload,
  );
  const data = response.data.data;
  if (data === undefined || data === null) throw new Error(response.data.message);
  return data;
};

// ─── Get All Folders ──────────────────────────────────────────────
export const getFoldersApi = async (): Promise<Folder[]> => {
  const response = await apiClient.get<ApiResponse<Folder[]>>(
    ENDPOINTS.FOLDERS.BASE,
  );
  return response.data.data ?? [];
};

// ─── Get Folder + Recordings ──────────────────────────────────────
export const getFolderWithRecordingsApi = async (
  id:    string,
  page  = 1,
  limit = 20,
): Promise<{ folder: Folder; recordings: Recording[]; total: number }> => {
  const response = await apiClient.get<ApiResponse<{
    folder: Folder; recordings: Recording[]; total: number;
  }>>(ENDPOINTS.FOLDERS.DETAIL(id), { params: { page, limit } });
  const data = response.data.data;
  if (data === undefined || data === null) throw new Error(response.data.message);
  return data;
};

// ─── Update Folder ────────────────────────────────────────────────
export const updateFolderApi = async (
  id:      string,
  payload: Partial<{
    name: string; description: string;
    color: string; icon: string; isPinned: boolean;
  }>,
): Promise<Folder> => {
  const response = await apiClient.put<ApiResponse<Folder>>(
    ENDPOINTS.FOLDERS.DETAIL(id),
    payload,
  );
  const data = response.data.data;
  if (data === undefined || data === null) throw new Error(response.data.message);
  return data;
};

// ─── Delete Folder ────────────────────────────────────────────────
export const deleteFolderApi = async (
  id:          string,
  moveToRoot = true,
): Promise<void> => {
  await apiClient.delete(ENDPOINTS.FOLDERS.DETAIL(id), {
    params: { moveToRoot },
  });
};
