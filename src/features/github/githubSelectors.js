import { createSelector } from '@reduxjs/toolkit';

const selectUser = (state) => state.github.user;
const selectRepos = (state) => state.github.repos;
const selectEvents = (state) => state.github.events;

export const selectAllRepos = createSelector(
  [selectRepos],
  (repos) => repos || []
);

export const selectLanguageStats = createSelector(
  [selectRepos],
  (repos) => {
    if (!repos || repos.length === 0) return [];
    const counts = repos.reduce((acc, repo) => {
      if (repo.language) acc[repo.language] = (acc[repo.language] || 0) + 1;
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

// 🧠 SINGLE SOURCE OF TRUTH: Master Intelligence Algorithm
// Used by both the Redux State (User Page) and the Promise.all fetch (Comparison Page)
export const analyzeDeveloperProfile = (user, repos, events) => {
  if (!user) return null;
  const safeRepos = Array.isArray(repos) ? repos : [];
  const safeEvents = Array.isArray(events) ? events : [];

  const now = new Date();
  const originalRepos = safeRepos.filter(r => !r.fork);
  const totalStars = safeRepos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const totalForks = safeRepos.reduce((acc, r) => acc + r.forks_count, 0);
  const totalWatchers = safeRepos.reduce((acc, r) => acc + r.watchers_count, 0);
  const totalOpenIssues = safeRepos.reduce((acc, r) => acc + r.open_issues_count, 0);
  const totalSizeKB = safeRepos.reduce((acc, r) => acc + r.size, 0);
  const avgRepoSizeMB = originalRepos.length ? (totalSizeKB / originalRepos.length / 1024).toFixed(1) : 0;
  const yearsActive = new Date().getFullYear() - new Date(user.created_at).getFullYear();

  // --- 1. REPO HEALTH, OS SCORE & TOP PROJECTS ---
  let healthTotal = 0;
  let reposWithIssues = 0;
  let reposWithWiki = 0;
  const langScores = {};

  const scoredRepos = safeRepos.map(repo => {
    const pushedDate = new Date(repo.pushed_at || repo.updated_at);
    const daysSincePush = (now - pushedDate) / (1000 * 60 * 60 * 24);
    
    let health = 0;
    if (repo.description) health += 20;
    if (repo.license) health += 20;
    if (repo.has_issues) { health += 15; reposWithIssues++; }
    if (repo.has_wiki || repo.homepage) { health += 15; if (repo.has_wiki) reposWithWiki++; }
    
    if (daysSincePush < 30) health += 30;
    else if (daysSincePush < 90) health += 20;
    else if (daysSincePush < 180) health += 10;
    
    health = Math.min(health, 100);
    healthTotal += health;

    if (repo.language) {
      const recencyWeight = daysSincePush < 90 ? 2 : (daysSincePush < 365 ? 1 : 0.2);
      langScores[repo.language] = (langScores[repo.language] || 0) + (repo.size * recencyWeight);
    }

    const starPoints = repo.stargazers_count * 50;
    const forkPoints = repo.forks_count * 25;
    const sizePoints = repo.size / 100; 
    const recencyBonus = daysSincePush < 60 ? 150 : (daysSincePush > 365 ? -100 : 0); 
    
    const algoScore = starPoints + forkPoints + sizePoints + (health * 2) + recencyBonus;

    return { ...repo, health, algoScore, daysSincePush };
  });

  const avgHealth = scoredRepos.length ? Math.round(healthTotal / scoredRepos.length) : 0;
  const osScore = safeRepos.length ? Math.round(((reposWithIssues + reposWithWiki) / (safeRepos.length * 2)) * 100) : 0;
  const topProjects = [...scoredRepos].sort((a, b) => b.algoScore - a.algoScore).slice(0, 3);
  
  const primaryStack = Object.entries(langScores).sort((a, b) => b[1] - a[1]).slice(0, 2).map(l => l[0]).join(' & ') || 'Unknown';

  // --- 2. COLLABORATION SIGNAL & VELOCITY ---
  let prCount = 0, issueCount = 0, pushCount = 0, totalCommits = 0;
  safeEvents.forEach(e => {
    if (e.type === 'PullRequestEvent' || e.type === 'PullRequestReviewEvent') prCount++;
    if (e.type === 'IssuesEvent') issueCount++;
    if (e.type === 'PushEvent') {
      pushCount++;
      const commitCount = e.payload?.size ?? e.payload?.commits?.length ?? 0;
      totalCommits += Math.max(1, commitCount); 
    }
  });

  const commitsPerPush = pushCount > 0 ? (totalCommits / pushCount).toFixed(1) : 0;

  let collabSignal = "Mostly Solo Developer";
  let collabColor = "text-gray-400";
  if (prCount > pushCount / 2) { collabSignal = "Highly Collaborative (Team Player)"; collabColor = "text-emerald-400"; }
  else if (prCount > pushCount / 10) { collabSignal = "Active Collaborator"; collabColor = "text-blue-400"; }

  // --- 3. AUDIT RED FLAGS & CONSISTENCY ---
  const redFlags = [];
  const minDaysSincePush = scoredRepos.length ? Math.min(...scoredRepos.map(r => r.daysSincePush)) : 999;
  
  if (minDaysSincePush > 365) redFlags.push("Critical: Completely inactive. No code pushed in over a year.");
  else if (minDaysSincePush > 180) redFlags.push("Warning: Severe activity gap. Inactive for 6+ months.");
  if (avgHealth < 40 && scoredRepos.length > 5) redFlags.push("Risk: Poor documentation and maintenance habits (Avg Health < 40%).");
  if (scoredRepos.filter(r => r.fork).length > originalRepos.length) redFlags.push("Context: Heavy reliance on forked repositories (low original output).");
  if (originalRepos.length > 20 && totalStars === 0) redFlags.push("Context: High volume of code pushed, but zero community impact (0 stars).");

  let expLevel = "Junior / Entry";
  if (yearsActive >= 5) expLevel = "Senior / Veteran";
  else if (yearsActive >= 2) expLevel = "Mid-Level";

  // --- 4. UNIFIED RETURN OBJECT ---
  return {
    profile: user, // Used heavily by ComparisonPage
    summary: { expLevel, primaryStack, collabSignal, collabColor, yearsActive, avgHealth },
    redFlags,
    topProjects,
    scoredRepos,
    metrics: { // Used by ComparisonPage's detailed breakdown
      followers: user.followers,
      yearsActive,
      company: user.company || null,
      location: user.location || null,
      hasBlog: user.blog ? 'Yes' : null,
      hireable: user.hireable !== null ? (user.hireable ? 'Yes' : 'No') : null,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      originalRepos: originalRepos.length,
      totalStars,
      totalForks,
      totalWatchers,
      totalOpenIssues,
      sizeMB: (totalSizeKB / 1024).toFixed(1),
      avgRepoSizeMB: Number(avgRepoSizeMB),
      avgHealth,
      osScore,
      totalCommits,
      prCount,
      issueCount,
      commitsPerPush: Number(commitsPerPush),
      primaryStack
    }
  };
};

// Redux Wrapper for UserPage
export const selectDeveloperInsights = createSelector(
  [selectUser, selectRepos, selectEvents],
  (user, repos, events) => {
    if (!user || !repos || !events) return null;
    return analyzeDeveloperProfile(user, repos, events);
  }
);