import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { githubAPI } from '../github/githubAPI';

export const searchUsersThunk = createAsyncThunk(
  'search/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await githubAPI.searchUsers(query);
      return response.data.items;
    } catch (error) {
      if (error.response?.status === 403) {
        return rejectWithValue('rateLimit');
      }
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    suggestions: [],
    loading: false,
    error: null,
    rateLimitExceeded: false,
  },
  reducers: {
    setQuery: (state, action) => { state.query = action.payload; },
    clearSearch: (state) => {
      state.suggestions = [];
      state.error = null;
      state.rateLimitExceeded = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload;
        state.rateLimitExceeded = false;
      })
      .addCase(searchUsersThunk.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === 'rateLimit') {
          state.rateLimitExceeded = true;
          state.error = 'Search limit reached. Try exact username.';
        } else {
          state.error = action.payload;
        }
      });
  },
});

export const { setQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;