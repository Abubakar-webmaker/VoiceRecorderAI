import { useCallback } from 'react';
import useAppDispatch   from '@hooks/useAppDispatch';
import useAppSelector   from '@hooks/useAppSelector';
import {
  fetchRecordingsThunk,
  fetchMoreRecordingsThunk,
  fetchFavoritesThunk,
  searchRecordingsThunk,
  toggleFavoriteThunk,
  deleteRecordingThunk,
  updateRecordingThunk,
  bulkDeleteThunk,
  setActiveFilter,
  setSort,
  setSearchQuery,
  setIsSelecting,
  toggleSelectId,
  clearSelection,
  selectRecordings,
  selectPagination,
  selectIsLoadingRec,
  selectIsLoadingMore,
  selectFavorites,
  selectSearchResults,
  selectSearchQuery,
  selectIsSearching,
  selectActiveFilter,
  selectSortConfig,
  selectIsSelecting,
  selectSelectedIds,
  selectIsUploading,
  selectUploadProgress,
  selectRecordingError,
  selectTotalRecordings,
} from '../store/recordingSlice';
import { selectFolders } from '@features/folder/store/folderSlice';
import type { FilterTab, RecordingQueryParams, Recording, PaginationInfo, Folder } from '@shared/types/recording.types';

const useRecordings = (): {
  recordings: Recording[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  favorites: Recording[];
  searchResults: Recording[];
  searchQuery: string;
  isSearching: boolean;
  activeFilter: FilterTab;
  sortConfig: { sortBy: string; sortOrder: string };
  isSelecting: boolean;
  selectedIds: string[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  totalRecordings: number;
  folders: Folder[];
  fetchRecordings: (params?: RecordingQueryParams) => Promise<unknown>;
  fetchMore: (params: RecordingQueryParams) => Promise<unknown>;
  fetchFavorites: () => Promise<unknown>;
  search: (q: string) => Promise<unknown>;
  setQuery: (q: string) => void;
  toggleFavorite: (id: string) => Promise<unknown>;
  deleteRecording: (id: string) => Promise<unknown>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<unknown>;
  bulkDelete: (ids: string[]) => Promise<unknown>;
  changeFilter: (filter: FilterTab) => void;
  changeSort: (params: { sortBy: string; sortOrder: string }) => void;
  startSelecting: () => void;
  toggleSelect: (id: string) => void;
  clearSelections: () => void;
} => {
  const dispatch = useAppDispatch();

  const recordings      = useAppSelector(selectRecordings);
  const pagination      = useAppSelector(selectPagination);
  const isLoading       = useAppSelector(selectIsLoadingRec);
  const isLoadingMore   = useAppSelector(selectIsLoadingMore);
  const favorites       = useAppSelector(selectFavorites);
  const searchResults   = useAppSelector(selectSearchResults);
  const searchQuery     = useAppSelector(selectSearchQuery);
  const isSearching     = useAppSelector(selectIsSearching);
  const activeFilter    = useAppSelector(selectActiveFilter);
  const sortConfig      = useAppSelector(selectSortConfig);
  const isSelecting     = useAppSelector(selectIsSelecting);
  const selectedIds     = useAppSelector(selectSelectedIds);
  const isUploading     = useAppSelector(selectIsUploading);
  const uploadProgress  = useAppSelector(selectUploadProgress);
  const error           = useAppSelector(selectRecordingError);
  const totalRecordings = useAppSelector(selectTotalRecordings);
  const folders         = useAppSelector(selectFolders);

  const fetchRecordings = useCallback(
    (params?: RecordingQueryParams) => dispatch(fetchRecordingsThunk(params ?? {})),
    [dispatch],
  );

  const fetchMore = useCallback(
    (params: RecordingQueryParams) => dispatch(fetchMoreRecordingsThunk(params)),
    [dispatch],
  );

  const fetchFavorites = useCallback(
    () => dispatch(fetchFavoritesThunk()),
    [dispatch],
  );

  const search = useCallback(
    (q: string) => dispatch(searchRecordingsThunk({ q })),
    [dispatch],
  );

  const setQuery = useCallback(
    (q: string) => dispatch(setSearchQuery(q)),
    [dispatch],
  );

  const toggleFavorite = useCallback(
    (id: string) => dispatch(toggleFavoriteThunk(id)),
    [dispatch],
  );

  const deleteRecording = useCallback(
    (id: string) => dispatch(deleteRecordingThunk(id)),
    [dispatch],
  );

  const updateRecording = useCallback(
    (id: string, updates: Partial<Recording>) =>
      dispatch(updateRecordingThunk({ id, updates })),
    [dispatch],
  );

  const bulkDelete = useCallback(
    (ids: string[]) => dispatch(bulkDeleteThunk(ids)),
    [dispatch],
  );

  const changeFilter = useCallback(
    (filter: FilterTab) => dispatch(setActiveFilter(filter)),
    [dispatch],
  );

  const changeSort = useCallback(
    (params: Parameters<typeof setSort>[0]) => dispatch(setSort(params)),
    [dispatch],
  );

  const startSelecting = useCallback(
    () => dispatch(setIsSelecting(true)),
    [dispatch],
  );

  const toggleSelect = useCallback(
    (id: string) => dispatch(toggleSelectId(id)),
    [dispatch],
  );

  const clearSelections = useCallback(
    () => dispatch(clearSelection()),
    [dispatch],
  );

  return {
    recordings, pagination, isLoading, isLoadingMore,
    favorites, searchResults, searchQuery, isSearching,
    activeFilter, sortConfig, isSelecting, selectedIds,
    isUploading, uploadProgress, error, totalRecordings, folders,
    fetchRecordings, fetchMore, fetchFavorites,
    search, setQuery, toggleFavorite, deleteRecording,
    updateRecording, bulkDelete, changeFilter, changeSort,
    startSelecting, toggleSelect, clearSelections,
  };
};

export default useRecordings;