import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState } from '@store/index';
import type { Folder }    from '@types/recording.types';
import {
  createFolderApi,
  getFoldersApi,
  updateFolderApi,
  deleteFolderApi,
} from '../services/folder.api';

interface FolderState {
  items:     Folder[];
  isLoading: boolean;
  error:     string | null;
}

const initialState: FolderState = {
  items:     [],
  isLoading: false,
  error:     null,
};

export const fetchFoldersThunk = createAsyncThunk(
  'folder/fetchAll',
  async (_, { rejectWithValue }) => {
    try { return await getFoldersApi(); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const createFolderThunk = createAsyncThunk(
  'folder/create',
  async (payload: Parameters<typeof createFolderApi>[0], { rejectWithValue }) => {
    try { return await createFolderApi(payload); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const updateFolderThunk = createAsyncThunk(
  'folder/update',
  async (
    payload: { id: string; updates: Parameters<typeof updateFolderApi>[1] },
    { rejectWithValue },
  ) => {
    try { return await updateFolderApi(payload.id, payload.updates); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const deleteFolderThunk = createAsyncThunk(
  'folder/delete',
  async (payload: { id: string; moveToRoot?: boolean }, { rejectWithValue }) => {
    try {
      await deleteFolderApi(payload.id, payload.moveToRoot);
      return payload.id;
    } catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

const folderSlice = createSlice({
  name: 'folder',
  initialState,
  reducers: {
    clearFolderError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoldersThunk.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchFoldersThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items     = action.payload;
      })
      .addCase(fetchFoldersThunk.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });
    builder.addCase(createFolderThunk.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });
    builder.addCase(updateFolderThunk.fulfilled, (state, action) => {
      const idx = state.items.findIndex((f) => f._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
    builder.addCase(deleteFolderThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((f) => f._id !== action.payload);
    });
  },
});

export const { clearFolderError } = folderSlice.actions;

const folState = (s: RootState) => s.folder;
export const selectFolders     = createSelector(folState, (s) => s.items);
export const selectFolderById  = (id: string) =>
  createSelector(folState, (s) => s.items.find((f) => f._id === id));
export const selectFolderLoading = createSelector(folState, (s) => s.isLoading);

export default folderSlice.reducer;