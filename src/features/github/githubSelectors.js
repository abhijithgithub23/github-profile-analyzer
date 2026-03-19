import { createSelector } from '@reduxjs/toolkit';

const selectUser = (state) => state.github.user;
const selectRepos = (state) => state.github.repos;
const selectEvents = (state) => state.github.events;

export const selectAllRepos = createSelector(
  [selectRepos],
  (repos) => repos || []
);

export const selectDeveloperInsights = createSelector(
  [selectUser, selectRepos, selectEvents],
  (user, repos, events) => {
    if (!user || !repos || !events) return null;

    const now = new Date();
    const originalRepos = repos.filter(r => !r.fork);
    const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);

    // --- 1. REPO HEALTH & TRUE TOP PROJECTS ALGORITHM ---
    let totalHealth = 0;
    const langScores = {};

    const scoredRepos = repos.map(repo => {
      const pushedDate = new Date(repo.pushed_at || repo.updated_at);
      const daysSincePush = (now - pushedDate) / (1000 * 60 * 60 * 24);
      
      // A. Calculate Repo Health (0-100)
      let health = 0;
      if (repo.description) health += 20;
      if (repo.license) health += 20;
      if (repo.has_issues) health += 15;
      if (repo.has_wiki || repo.homepage) health += 15;
      
      // Recency weighting for health
      if (daysSincePush < 30) health += 30;
      else if (daysSincePush < 90) health += 20;
      else if (daysSincePush < 180) health += 10;
      
      health = Math.min(health, 100);
      totalHealth += health;

      // B. Weighted Primary Stack (Size * Recency)
      if (repo.language) {
        // Recent code is worth more than old code
        const recencyWeight = daysSincePush < 90 ? 2 : (daysSincePush < 365 ? 1 : 0.2);
        langScores[repo.language] = (langScores[repo.language] || 0) + (repo.size * recencyWeight);
      }

      // C. Top Project Algorithm (Penalizes dead repos, boosts maintained ones)
      const starPoints = repo.stargazers_count * 50;
      const forkPoints = repo.forks_count * 25;
      const sizePoints = repo.size / 100; 
      const recencyBonus = daysSincePush < 60 ? 150 : (daysSincePush > 365 ? -100 : 0); // Penalize abandoned code
      
      const algoScore = starPoints + forkPoints + sizePoints + (health * 2) + recencyBonus;

      return { ...repo, health, algoScore, daysSincePush };
    });

    const avgHealth = scoredRepos.length ? Math.round(totalHealth / scoredRepos.length) : 0;
    const topProjects = [...scoredRepos].sort((a, b) => b.algoScore - a.algoScore).slice(0, 3);
    
    // Sort stack by calculated volume-recency weight
    const primaryStack = Object.entries(langScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(l => l[0])
      .join(' & ') || 'Unknown';

    // --- 2. COLLABORATION SIGNAL & VELOCITY ---
    let prCount = 0, pushCount = 0;
    events.forEach(e => {
      if (e.type === 'PullRequestEvent' || e.type === 'PullRequestReviewEvent' || e.type === 'IssuesEvent') prCount++;
      if (e.type === 'PushEvent') pushCount++;
    });

    let collabSignal = "Mostly Solo Developer";
    let collabColor = "text-gray-400";
    if (prCount > pushCount / 2) { collabSignal = "Highly Collaborative (Team Player)"; collabColor = "text-emerald-400"; }
    else if (prCount > pushCount / 10) { collabSignal = "Active Collaborator"; collabColor = "text-blue-400"; }

    // --- 3. AUDIT RED FLAGS & CONSISTENCY ---
    const redFlags = [];
    const minDaysSincePush = scoredRepos.length ? Math.min(...scoredRepos.map(r => r.daysSincePush)) : 999;
    
    // Activity Gaps
    if (minDaysSincePush > 365) redFlags.push("Critical: Completely inactive. No code pushed in over a year.");
    else if (minDaysSincePush > 180) redFlags.push("Warning: Severe activity gap. Inactive for 6+ months.");
    
    // Quality & Impact
    if (avgHealth < 40 && scoredRepos.length > 5) redFlags.push("Risk: Poor documentation and maintenance habits (Avg Health < 40%).");
    if (scoredRepos.filter(r => r.fork).length > originalRepos.length) redFlags.push("Context: Heavy reliance on forked repositories (low original output).");
    if (originalRepos.length > 20 && totalStars === 0) redFlags.push("Context: High volume of code pushed, but zero community impact (0 stars).");

    // --- 4. SUMMARY DATA ---
    const yearsActive = new Date().getFullYear() - new Date(user.created_at).getFullYear();
    let expLevel = "Junior / Entry";
    if (yearsActive >= 5) expLevel = "Senior / Veteran";
    else if (yearsActive >= 2) expLevel = "Mid-Level";

    return {
      summary: { expLevel, primaryStack, collabSignal, collabColor, yearsActive, avgHealth },
      redFlags,
      topProjects,
      scoredRepos // Passed down so the table can show health
    };
  }
);