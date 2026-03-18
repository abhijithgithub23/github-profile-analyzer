import { createSelector } from '@reduxjs/toolkit';

const selectRepos = (state) => state.github.repos;
const selectEvents = (state) => state.github.events;

export const selectTopRepos = createSelector(
  [selectRepos],
  (repos) => {
    if (!repos) return [];
    return [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5);
  }
);

export const selectLanguageStats = createSelector(
  [selectRepos],
  (repos) => {
    if (!repos || repos.length === 0) return [];
    const counts = repos.reduce((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {});
    
    const totalWithLanguage = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([lang, count]) => ({
        language: lang,
        percentage: ((count / totalWithLanguage) * 100).toFixed(1)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
);

export const selectActivityScore = createSelector(
  [selectEvents],
  (events) => {
    if (!events) return { level: 'Low', count: 0 };
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    const count = pushEvents.length;
    
    let level = 'Low';
    if (count > 15) level = 'High';
    else if (count >= 5) level = 'Medium';
    
    return { level, count };
  }
);