import { createAsyncThunk } from '@reduxjs/toolkit';
import { githubAPI } from './githubAPI';

export const fetchUser = createAsyncThunk('github/fetchUser', async (username, { rejectWithValue }) => {
  try {
    const response = await githubAPI.getUser(username);
    console.log(response.data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
  }
});

export const fetchRepos = createAsyncThunk('github/fetchRepos', async (username, { rejectWithValue }) => {
  try {
    const response = await githubAPI.getRepos(username);
    console.log(response.data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch repos');
  }
});

export const fetchEvents = createAsyncThunk('github/fetchEvents', async (username, { rejectWithValue }) => {
  try {
    const response = await githubAPI.getEvents(username);
    console.log(response.data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const fetchGithubData = createAsyncThunk(
  'github/fetchGithubData',
  async (username, { dispatch, rejectWithValue }) => {
    try {
      // Parallel execution for efficiency
      await Promise.all([
        dispatch(fetchUser(username)).unwrap(),
        dispatch(fetchRepos(username)).unwrap(),
        dispatch(fetchEvents(username)).unwrap(),
      ]);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);