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
    
    const totalWithLanguage = Object.values(counts).reduce((sum, langcount) => sum + langcount, 0);
    return Object.entries(counts)
      .map(([lang, count]) => ({
        language: lang,
        percentage: ((count / totalWithLanguage) * 100).toFixed(1)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
);

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
  const yearsActive = now.getFullYear() - new Date(user.created_at).getFullYear();

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

  // --- 2. ACTIVITY PROFILE (Based on the fetched events array) ---
  let pushCount = 0;
  // let totalCommits = 0;
  let prInteractions = 0;
  let issueInteractions = 0;
  
  // Calculate Velocity: How many days did it take to generate these events?
  let velocityDays = 0;
  if (safeEvents.length > 1) {
    const newestEvent = new Date(safeEvents[0].created_at);
    const oldestEvent = new Date(safeEvents[safeEvents.length - 1].created_at);
    // Add 1 so if they did everything today, it counts as 1 day, not 0 days.
    velocityDays = Math.max(1, Math.round((newestEvent - oldestEvent) / (1000 * 60 * 60 * 24))) + 1;
  } else if (safeEvents.length === 1) {
    velocityDays = 1;
  }

  safeEvents.forEach(e => {
    // Coding Actions
    if (e.type === 'PushEvent') {
      pushCount++;
      // totalCommits += e.payload?.size || 0;
    }
    // PR Actions (Routing PR comments correctly)
    else if (['PullRequestEvent', 'PullRequestReviewEvent', 'PullRequestReviewCommentEvent'].includes(e.type)) {
      prInteractions++;
    }
    // Issue Actions
    else if (['IssuesEvent', 'IssueCommentEvent'].includes(e.type)) {
      if (e.payload?.issue?.pull_request) {
        prInteractions++; 
      } else {
        issueInteractions++;
      }
    }
  });

  // Calculate percentages based strictly on interaction types
  const actionableEvents = pushCount + prInteractions + issueInteractions;
  const codePercent = actionableEvents ? Math.round((pushCount / actionableEvents) * 100) : 0;
  const reviewPercent = actionableEvents ? Math.round((prInteractions / actionableEvents) * 100) : 0;
  const issuePercent = actionableEvents ? Math.round((issueInteractions / actionableEvents) * 100) : 0;
  
  // const avgCommitsPerPush = pushCount > 0 ? (totalCommits / pushCount).toFixed(1) : 0;
  const totalEventsTracked = safeEvents.length;

  // Collaboration signal
  let collabSignal = "Mostly Solo Developer";
  let collabColor = "text-gray-400";
  if (prInteractions > pushCount / 2) { collabSignal = "Highly Collaborative"; collabColor = "text-emerald-400"; }
  else if (prInteractions > pushCount / 10) { collabSignal = "Active Collaborator"; collabColor = "text-blue-400"; }

  let expLevel = "Beginner";
  if (yearsActive >= 10) expLevel = "Expert / Veteran";
  else if (yearsActive >= 7) expLevel = "Lead / Principal";
  else if (yearsActive >= 5) expLevel = "Senior";
  else if (yearsActive >= 3) expLevel = "Mid-Level";
  else if (yearsActive >= 1) expLevel = "Junior";
  else expLevel = "Newbie";

  return {
    profile: user, 
    summary: { expLevel, primaryStack, collabSignal, collabColor, yearsActive, avgHealth },
    topProjects,
    scoredRepos,
    metrics: { 
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
      primaryStack,
      
      velocityDays,
      totalEventsTracked,
      // avgCommitsPerPush: Number(avgCommitsPerPush),
      codePercent,
      reviewPercent,
      issuePercent
    }
  };
};

export const selectDeveloperInsights = createSelector(
  [selectUser, selectRepos, selectEvents],
  (user, repos, events) => {
    if (!user || !repos || !events) return null;
    return analyzeDeveloperProfile(user, repos, events);
  }
);