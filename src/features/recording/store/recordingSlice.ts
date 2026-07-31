import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState } from '@store/index';
import type {
  Recording,
  PaginationInfo,
  RecordingQueryParams,
  FilterTab,
} from '@types/recording.types';
import {
  getRecordingsApi,
  getRecordingByIdApi,
  getFavoritesApi,
  searchRecordingsApi,
  updateRecordingApi,
  toggleFavoriteApi,
  deleteRecordingApi,
  bulkDeleteApi,
  moveRecordingApi,
  incrementPlayApi,
} from '../services/recording.api';

// ─── State ────────────────────────────────────────────────────────
interface RecordingState {
  // All recordings (paginated)
  items:          Recording[];
  pagination:     PaginationInfo | null;
  isLoading:      boolean;
  isLoadingMore:  boolean;
  error:          string | null;

  // Selected recording (detail view)
  selectedRecording: Recording | null;
  isLoadingSelected: boolean;

  // Favorites
  favorites:     Recording[];
  favTotal:      number;

  // Search
  searchResults: Recording[];
  searchTotal:   number;
  searchQuery:   string;
  isSearching:   boolean;

  // UI State
  activeFilter:  FilterTab;
  sortBy:        RecordingQueryParams['sortBy'];
  sortOrder:     RecordingQueryParams['sortOrder'];
  activeFolderId: string | null;

  // Upload progress
  uploadProgress: number;
  isUploading:    boolean;

  // Selection (for bulk ops)
  selectedIds:   string[];
  isSelecting:   boolean;
}

const initialState: RecordingState = {
  items:             [],
  pagination:        null,
  isLoading:         false,
  isLoadingMore:     false,
  error:             null,
  selectedRecording: null,
  isLoadingSelected: false,
  favorites:         [],
  favTotal:          0,
  searchResults:     [],
  searchTotal:       0,
  searchQuery:       '',
  isSearching:       false,
  activeFilter:      'all',
  sortBy:            'createdAt',
  sortOrder:         'desc',
  activeFolderId:    null,
  uploadProgress:    0,
  isUploading:       false,
  selectedIds:       [],
  isSelecting:       false,
};

// ─── Async Thunks ─────────────────────────────────────────────────
export const fetchRecordingsThunk = createAsyncThunk(
  'recording/fetchAll',
  async (params: RecordingQueryParams, { rejectWithValue }) => {
    try {
      return await getRecordingsApi(params);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message ?? 'Failed to fetch recordings');
    }
  },
);

export const fetchMoreRecordingsThunk = createAsyncThunk(
  'recording/fetchMore',
  async (params: RecordingQueryParams, { rejectWithValue }) => {
    try {
      return await getRecordingsApi(params);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const fetchRecordingByIdThunk = createAsyncThunk(
  'recording/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await getRecordingByIdApi(id);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const fetchFavoritesThunk = createAsyncThunk(
  'recording/fetchFavorites',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      return await getFavoritesApi(params.page, params.limit);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const searchRecordingsThunk = createAsyncThunk(
  'recording/search',
  async (params: { q: string; page?: number }, { rejectWithValue }) => {
    try {
      return await searchRecordingsApi(params);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const updateRecordingThunk = createAsyncThunk(
  'recording/update',
  async (
    payload: {
      id:      string;
      updates: Partial<{ title: string; description: string; tags: string[]; folderId: string | null }>;
    },
    { rejectWithValue },
  ) => {
    try {
      return await updateRecordingApi(payload.id, payload.updates);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const toggleFavoriteThunk = createAsyncThunk(
  'recording/toggleFavorite',
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await toggleFavoriteApi(id);
      return { id, isFavorite: result.isFavorite };
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const deleteRecordingThunk = createAsyncThunk(
  'recording/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteRecordingApi(id);
      return id;
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const bulkDeleteThunk = createAsyncThunk(
  'recording/bulkDelete',
  async (ids: string[], { rejectWithValue }) => {
    try {
      await bulkDeleteApi(ids);
      return ids;
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const moveRecordingThunk = createAsyncThunk(
  'recording/move',
  async (
    payload: { id: string; folderId: string | null },
    { rejectWithValue },
  ) => {
    try {
      return await moveRecordingApi(payload.id, payload.folderId);
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

export const incrementPlayThunk = createAsyncThunk(
  'recording/incrementPlay',
  async (id: string) => {
    await incrementPlayApi(id).catch(() => { /* silent fail */ });
    return id;
  },
);

// ─── Slice ────────────────────────────────────────────────────────
const recordingSlice = createSlice({
  name: 'recording',
  initialState,

  reducers: {
    setActiveFilter: (state, action: PayloadAction<FilterTab>) => {
      state.activeFilter = action.payload;
      state.items        = [];
      state.pagination   = null;
    },
    setSort: (state, action: PayloadAction<{
      sortBy?: RecordingQueryParams['sortBy'];
      sortOrder?: RecordingQueryParams['sortOrder'];
    }>) => {
      if (action.payload.sortBy)    state.sortBy    = action.payload.sortBy;
      if (action.payload.sortOrder) state.sortOrder = action.payload.sortOrder;
    },
    setActiveFolderId: (state, action: PayloadAction<string | null>) => {
      state.activeFolderId = action.payload;
      state.items          = [];
      state.pagination     = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      if (!action.payload) {
        state.searchResults = [];
        state.searchTotal   = 0;
      }
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setIsUploading: (state, action: PayloadAction<boolean>) => {
      state.isUploading    = action.payload;
      if (!action.payload) state.uploadProgress = 0;
    },
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.items.unshift(action.payload);
      if (state.pagination != null) {
        state.pagination.totalItems += 1;
      }
    },
    clearSelectedRecording: (state) => {
      state.selectedRecording = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    toggleSelectId: (state, action: PayloadAction<string>) => {
      const idx = state.selectedIds.indexOf(action.payload);
      if (idx === -1) state.selectedIds.push(action.payload);
      else            state.selectedIds.splice(idx, 1);
    },
    setIsSelecting: (state, action: PayloadAction<boolean>) => {
      state.isSelecting = action.payload;
      if (!action.payload) state.selectedIds = [];
    },
    clearSelection: (state) => {
      state.selectedIds = [];
      state.isSelecting = false;
    },
  },

  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchRecordingsThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchRecordingsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items     = action.payload.recordings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRecordingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // Fetch More (pagination)
    builder
      .addCase(fetchMoreRecordingsThunk.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreRecordingsThunk.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        state.items.push(...action.payload.recordings);
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMoreRecordingsThunk.rejected, (state) => {
        state.isLoadingMore = false;
      });

    // Fetch By ID
    builder
      .addCase(fetchRecordingByIdThunk.pending, (state) => {
        state.isLoadingSelected = true;
      })
      .addCase(fetchRecordingByIdThunk.fulfilled, (state, action) => {
        state.isLoadingSelected = false;
        state.selectedRecording  = action.payload;
      })
      .addCase(fetchRecordingByIdThunk.rejected, (state) => {
        state.isLoadingSelected = false;
      });

    // Favorites
    builder
      .addCase(fetchFavoritesThunk.fulfilled, (state, action) => {
        state.favorites = action.payload.recordings;
        state.favTotal  = action.payload.total;
      });

    // Search
    builder
      .addCase(searchRecordingsThunk.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchRecordingsThunk.fulfilled, (state, action) => {
        state.isSearching   = false;
        state.searchResults = action.payload.recordings;
        state.searchTotal   = action.payload.total;
      })
      .addCase(searchRecordingsThunk.rejected, (state) => {
        state.isSearching = false;
      });

    // Update
    builder.addCase(updateRecordingThunk.fulfilled, (state, action) => {
      const idx = state.items.findIndex((r) => r._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
      if (state.selectedRecording?._id === action.payload._id) {
        state.selectedRecording = action.payload;
      }
    });

    // Toggle Favorite
    builder.addCase(toggleFavoriteThunk.fulfilled, (state, action) => {
      const { id, isFavorite } = action.payload;
      const rec = state.items.find((r) => r._id === id);
      if (rec) rec.isFavorite = isFavorite;
      if (state.selectedRecording?._id === id) {
        state.selectedRecording.isFavorite = isFavorite;
      }
      if (!isFavorite) {
        state.favorites = state.favorites.filter((r) => r._id !== id);
      }
    });

    // Delete
    builder.addCase(deleteRecordingThunk.fulfilled, (state, action) => {
      state.items     = state.items.filter((r) => r._id !== action.payload);
      state.favorites = state.favorites.filter((r) => r._id !== action.payload);
      if (state.selectedRecording?._id === action.payload) {
        state.selectedRecording = null;
      }
    });

    // Bulk Delete
    builder.addCase(bulkDeleteThunk.fulfilled, (state, action) => {
      const deleted = new Set(action.payload);
      state.items       = state.items.filter((r) => !deleted.has(r._id));
      state.favorites   = state.favorites.filter((r) => !deleted.has(r._id));
      state.selectedIds = [];
      state.isSelecting = false;
    });

    // Move
    builder.addCase(moveRecordingThunk.fulfilled, (state, action) => {
      const idx = state.items.findIndex((r) => r._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // Increment Play
    builder.addCase(incrementPlayThunk.fulfilled, (state, action) => {
      const rec = state.items.find((r) => r._id === action.payload);
      if (rec) rec.playCount += 1;
    });
  },
});

export const {
  setActiveFilter, setSort, setActiveFolderId,
  setSearchQuery, setUploadProgress, setIsUploading,
  addRecording, clearSelectedRecording, clearError,
  toggleSelectId, setIsSelecting, clearSelection,
} = recordingSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────
const recState = (s: RootState) => s.recording;

export const selectRecordings       = createSelector(recState, (s) => s.items);
export const selectPagination       = createSelector(recState, (s) => s.pagination);
export const selectIsLoadingRec     = createSelector(recState, (s) => s.isLoading);
export const selectIsLoadingMore    = createSelector(recState, (s) => s.isLoadingMore);
export const selectSelectedRec      = createSelector(recState, (s) => s.selectedRecording);
export const selectFavorites        = createSelector(recState, (s) => s.favorites);
export const selectSearchResults    = createSelector(recState, (s) => s.searchResults);
export const selectSearchQuery      = createSelector(recState, (s) => s.searchQuery);
export const selectIsSearching      = createSelector(recState, (s) => s.isSearching);
export const selectActiveFilter     = createSelector(recState, (s) => s.activeFilter);
export const selectActiveFolderId   = createSelector(recState, (s) => s.activeFolderId);
export const selectSortConfig       = createSelector(recState, (s) => ({
  sortBy: s.sortBy, sortOrder: s.sortOrder,
}));
export const selectIsUploading      = createSelector(recState, (s) => s.isUploading);
export const selectUploadProgress   = createSelector(recState, (s) => s.uploadProgress);
export const selectSelectedIds      = createSelector(recState, (s) => s.selectedIds);
export const selectIsSelecting      = createSelector(recState, (s) => s.isSelecting);
export const selectRecordingError   = createSelector(recState, (s) => s.error);
export const selectTotalRecordings  = createSelector(
  recState, (s) => s.pagination?.totalItems ?? s.items.length,
);

export default recordingSlice.reducer;