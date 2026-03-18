import { createSelector } from '@reduxjs/toolkit';

const selectRepos = (state) => state.github.repos;
const selectEvents = (state) => state.github.events;

export const selectTopRepos = createSelector(
  [selectRepos],
  (repos) => {
    if (!repos) return [];
    return [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4); // Top 4 for a better grid layout
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

// 🧠 NEW: Deep Developer Insights
export const selectDeveloperInsights = createSelector(
  [selectRepos, selectEvents],
  (repos, events) => {
    if (!repos || !events) return null;
    
    // 1. Repo Origin Analysis
    const originalRepos = repos.filter(r => !r.fork);
    const forkedRepos = repos.filter(r => r.fork);
    
    // 2. Impact Analysis
    const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
    const avgStars = originalRepos.length ? (totalStars / originalRepos.length).toFixed(1) : 0;
    
    // 3. Habit Analysis (from last 100 events)
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    const totalRecentCommits = pushEvents.reduce((acc, e) => acc + (e.payload?.commits?.length || 0), 0);
    const issuesCreated = events.filter(e => e.type === 'IssuesEvent' && e.payload?.action === 'opened').length;
    const prsOpened = events.filter(e => e.type === 'PullRequestEvent' && e.payload?.action === 'opened').length;

    // 4. Determine Developer Persona
    const langs = new Set(repos.map(r => r.language).filter(Boolean));
    let persona = "Steady Builder"; 
    let personaColor = "text-blue-600 bg-blue-100";

    if (totalStars > 100) {
      persona = "High-Impact Creator";
      personaColor = "text-purple-600 bg-purple-100";
    } else if (langs.size >= 6) {
      persona = "Language Polyglot";
      personaColor = "text-emerald-600 bg-emerald-100";
    } else if (forkedRepos.length > originalRepos.length + 5) {
      persona = "Open Source Explorer";
      personaColor = "text-orange-600 bg-orange-100";
    } else if (totalRecentCommits > 50) {
      persona = "Code Machine";
      personaColor = "text-red-600 bg-red-100";
    }

    return {
      originalCount: originalRepos.length,
      forkedCount: forkedRepos.length,
      totalStars,
      avgStars,
      totalRecentCommits,
      issuesCreated,
      prsOpened,
      persona,
      personaColor,
      uniqueLanguages: langs.size
    };
  }
);