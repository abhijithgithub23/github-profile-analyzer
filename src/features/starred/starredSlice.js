import { createSlice } from '@reduxjs/toolkit';

const loadStarred = () => {
  try {
    const serialized = localStorage.getItem('starredUsers');
    return serialized ? JSON.parse(serialized) : [];
  } catch (e) {
    console.log("Error", e);
    return [];
  }
};

const starredSlice = createSlice({
  name: 'starred',
  initialState: {
    starredUsers: loadStarred(),
  },
  reducers: {
    toggleStar: (state, action) => {
      const user = action.payload;
      const existsIndex = state.starredUsers.findIndex(u => u.login === user.login);
      
      if (existsIndex >= 0) {
        state.starredUsers.splice(existsIndex, 1);
      } else {
        state.starredUsers.push({
          login: user.login,
          avatar_url: user.avatar_url,
          name: user.name
        });
      }
      localStorage.setItem('starredUsers', JSON.stringify(state.starredUsers));
    }
  }
});

export const { toggleStar } = starredSlice.actions;
export default starredSlice.reducer;