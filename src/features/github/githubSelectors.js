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

export const selectDeveloperInsights = createSelector(
  [selectUser, selectRepos, selectEvents],
  (user, repos, events) => {
    if (!user || !repos || !events) return null;
    
    // 1. REPO ECOSYSTEM & IMPACT
    const originalRepos = repos.filter(r => !r.fork);
    const forkedRepos = repos.filter(r => r.fork);
    const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
    const totalWatchers = repos.reduce((acc, r) => acc + r.watchers_count, 0);
    const totalIssues = repos.reduce((acc, r) => acc + r.open_issues_count, 0);
    const totalSizeKB = repos.reduce((acc, r) => acc + r.size, 0);
    const sizeMB = (totalSizeKB / 1024).toFixed(2);

    // 2. CODE LONGEVITY & OPEN SOURCE SCORE
    const dates = repos.map(r => new Date(r.created_at).getTime());
    const oldestRepoYear = dates.length ? new Date(Math.min(...dates)).getFullYear() : new Date().getFullYear();
    const reposWithIssues = repos.filter(r => r.has_issues).length;
    const reposWithWiki = repos.filter(r => r.has_wiki).length;
    const openSourceScore = repos.length ? Math.round(((reposWithIssues + reposWithWiki) / (repos.length * 2)) * 100) : 0;

    // 3. EVENT DISTRIBUTION & VELOCITY
    let eventCounts = { push: 0, pr: 0, issue: 0, create: 0, other: 0 };
    let totalCommits = 0;

    events.forEach(e => {
      if (e.type === 'PushEvent') {
        eventCounts.push++;
        totalCommits += (e.payload?.commits?.length || 0);
      } else if (e.type === 'PullRequestEvent') eventCounts.pr++;
      else if (e.type === 'IssuesEvent') eventCounts.issue++;
      else if (e.type === 'CreateEvent') eventCounts.create++;
      else eventCounts.other++;
    });

    const commitsPerPush = eventCounts.push ? (totalCommits / eventCounts.push).toFixed(1) : 0;

    // 4. SCHEDULE ANALYSIS
    const hours = events.map(e => new Date(e.created_at).getHours());
    let schedule = "Balanced";
    let scheduleIcon = "☀️";
    if (hours.length > 0) {
      const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
      if (avgHour >= 0 && avgHour < 6) { schedule = "Night Owl"; scheduleIcon = "🦉"; }
      else if (avgHour >= 6 && avgHour < 12) { schedule = "Early Bird"; scheduleIcon = "🌅"; }
      else if (avgHour >= 12 && avgHour < 18) { schedule = "Daytime Coder"; scheduleIcon = "☕"; }
      else { schedule = "Evening Hacker"; scheduleIcon = "🌙"; }
    }

    // 5. DEVELOPER DNA STATS
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentlyUpdated = repos.filter(r => new Date(r.updated_at) > ninetyDaysAgo).length;
    const statMaintenance = repos.length ? Math.round((recentlyUpdated / repos.length) * 100) : 0;
    
    const statImpact = Math.min(Math.round(((totalStars + totalWatchers) / 50) * 100), 100) || 5; 
    const statVelocity = Math.min(Math.round(((eventCounts.push + totalCommits) / 100) * 100), 100) || 5;

    const langs = new Set(repos.map(r => r.language).filter(Boolean));
    const langCounts = Object.values(repos.reduce((acc, r) => { if (r.language) acc[r.language] = (acc[r.language] || 0) + 1; return acc; }, {}));
    const topLangCount = langCounts.length ? Math.max(...langCounts) : 0;
    const statFocus = repos.length ? Math.round((topLangCount / repos.length) * 100) : 0;

    // 6. 🧠 NEW: LIVE ACTIVITY PULSE
    const recentPulse = events.slice(0, 6).map(e => {
      let action = "Performed an action in";
      let color = "bg-gray-600";
      let text = "text-gray-400";
      
      if (e.type === 'PushEvent') { 
        action = `Pushed ${e.payload.commits?.length || 1} commit(s) to`; 
        color = "bg-blue-500"; text = "text-blue-400";
      } else if (e.type === 'PullRequestEvent') { 
        action = `${e.payload.action} a PR in`; 
        color = "bg-purple-500"; text = "text-purple-400";
      } else if (e.type === 'IssuesEvent') { 
        action = `${e.payload.action} an issue in`; 
        color = "bg-orange-500"; text = "text-orange-400";
      } else if (e.type === 'CreateEvent') { 
        action = `Created ${e.payload.ref_type || 'repository'}`; 
        color = "bg-emerald-500"; text = "text-emerald-400";
      } else if (e.type === 'WatchEvent') { 
        action = `Starred repository`; 
        color = "bg-yellow-500"; text = "text-yellow-400";
      }
      
      return {
        id: e.id,
        action,
        repo: e.repo.name.split('/')[1] || e.repo.name, // Just the repo name, not the owner
        time: new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        color,
        text
      };
    });

    // 7. DYNAMIC PERSONA
    let persona = "Steady Builder"; 
    let personaGlow = "shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500/50 text-blue-400";

    if (totalStars > 100 || totalWatchers > 50) {
      persona = "High-Impact Creator";
      personaGlow = "shadow-[0_0_15px_rgba(168,85,247,0.5)] border-purple-500/50 text-purple-400";
    } else if (langs.size >= 5 && statFocus < 50) {
      persona = "Polyglot Engineer";
      personaGlow = "shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-500/50 text-emerald-400";
    } else if (openSourceScore > 80 && totalIssues > 10) {
      persona = "Open Source Maintainer";
      personaGlow = "shadow-[0_0_15px_rgba(249,115,22,0.5)] border-orange-500/50 text-orange-400";
    } else if (statVelocity > 70) {
      persona = "Code Machine";
      personaGlow = "shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500/50 text-red-400";
    }

    return {
      originalCount: originalRepos.length,
      forkedCount: forkedRepos.length,
      totalStars,
      totalWatchers,
      totalIssues,
      sizeMB,
      oldestRepoYear,
      openSourceScore,
      eventCounts,
      totalCommits,
      commitsPerPush,
      schedule,
      scheduleIcon,
      uniqueLanguages: langs.size,
      dna: { maintenance: statMaintenance, impact: statImpact, velocity: statVelocity, focus: statFocus },
      recentPulse,
      persona,
      personaGlow
    };
  }
);