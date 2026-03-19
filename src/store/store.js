import { configureStore } from '@reduxjs/toolkit';
import githubReducer from '../features/github/githubSlice';
import searchReducer from '../features/search/searchSlice';
import starredReducer from '../features/starred/starredSlice';
import comparisonReducer from '../features/comparison/comparisonSlice'; 

export const store = configureStore({
  reducer: {
    github: githubReducer,
    search: searchReducer,
    starred: starredReducer,
    comparison: comparisonReducer, 
  },
});