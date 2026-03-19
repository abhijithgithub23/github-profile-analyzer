import { createSlice } from '@reduxjs/toolkit';

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState: {
    queue: [], // Will hold max 2 usernames, e.g., ['torvalds', 'gaearon']
  },
  reducers: {
    toggleCompare: (state, action) => {
      const username = action.payload;
      if (state.queue.includes(username)) {
        // Remove if already in queue
        state.queue = state.queue.filter(u => u !== username);
      } else {
        // Add to queue. If already 2, remove the oldest one first.
        if (state.queue.length >= 2) state.queue.shift(); 
        state.queue.push(username);
      }
    },
    clearCompare: (state) => {
      state.queue = [];
    }
  }
});

export const { toggleCompare, clearCompare } = comparisonSlice.actions;
export default comparisonSlice.reducer;