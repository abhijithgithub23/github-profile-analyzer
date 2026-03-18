import { createSlice } from '@reduxjs/toolkit';
import { fetchUser, fetchRepos, fetchEvents, fetchGithubData } from './githubThunks';

const initialState = {
  user: null,
  repos: [],
  events: [],
  loading: false,
  error: null,
};

const githubSlice = createSlice({
  name: 'github',
  initialState,
  reducers: {
    clearGithubData: (state) => {
      state.user = null;
      state.repos = [];
      state.events = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGithubData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGithubData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchGithubData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchRepos.fulfilled, (state, action) => {
        state.repos = action.payload;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.events = action.payload;
      });
  },
});

export const { clearGithubData } = githubSlice.actions;
export default githubSlice.reducer;