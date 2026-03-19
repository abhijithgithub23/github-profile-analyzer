import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleCompare, clearCompare } from '../features/comparison/comparisonSlice';
import { githubAPI } from '../features/github/githubAPI';

export default function ComparisonPage() {
  const queue = useSelector(state => state.comparison.queue);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (queue.length !== 2) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch ALL data for User 1
        const p1User = githubAPI.getUser(queue[0]);
        const p1Repos = githubAPI.getRepos(queue[0]);
        const p1Events = githubAPI.getEvents(queue[0]);
        
        // Fetch ALL data for User 2
        const p2User = githubAPI.getUser(queue[1]);
        const p2Repos = githubAPI.getRepos(queue[1]);
        const p2Events = githubAPI.getEvents(queue[1]);

        const [r1U, r1R, r1E, r2U, r2R, r2E] = await Promise.all([
          p1User, p1Repos, p1Events, 
          p2User, p2Repos, p2Events
        ]);

        setData({
          user1: analyzeUser(r1U.data, r1R.data, r1E.data),
          user2: analyzeUser(r2U.data, r2R.data, r2E.data)
        });

      } catch (err) {
        console.error("Comparison Fetch Error:", err);
        setError("Failed to fetch data. One of the users might not exist or API rate limits were hit.");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [queue]);

  // 🧠 ENHANCED: Deep Intelligence Algorithm with New Metrics
  const analyzeUser = (user, repos, events) => {
    const safeRepos = Array.isArray(repos) ? repos : [];
    const safeEvents = Array.isArray(events) ? events : [];

    const originalRepos = safeRepos.filter(r => !r.fork);
    const totalStars = safeRepos.reduce((acc, r) => acc + r.stargazers_count, 0);
    const totalForks = safeRepos.reduce((acc, r) => acc + r.forks_count, 0);
    const totalWatchers = safeRepos.reduce((acc, r) => acc + r.watchers_count, 0);
    const totalOpenIssues = safeRepos.reduce((acc, r) => acc + r.open_issues_count, 0);
    const totalSizeKB = safeRepos.reduce((acc, r) => acc + r.size, 0);
    const avgRepoSizeMB = originalRepos.length ? (totalSizeKB / originalRepos.length / 1024).toFixed(1) : 0;
    const yearsActive = new Date().getFullYear() - new Date(user.created_at).getFullYear();
    
    // Calculate Health & Open Source Score
    let healthTotal = 0;
    let reposWithIssues = 0;
    let reposWithWiki = 0;

    originalRepos.forEach(repo => {
      if (repo.description) healthTotal += 20;
      if (repo.has_issues) { healthTotal += 10; reposWithIssues++; }
      if (repo.license) healthTotal += 10;
      if (repo.has_wiki) reposWithWiki++;
    });
    
    const avgHealth = originalRepos.length ? Math.round(healthTotal / originalRepos.length) : 0;
    const osScore = safeRepos.length ? Math.round(((reposWithIssues + reposWithWiki) / (safeRepos.length * 2)) * 100) : 0;

    // Calculate Operational Habits
    let prCount = 0, issueCount = 0, pushCount = 0, totalCommits = 0;
    
    safeEvents.forEach(e => {
      if (e.type === 'PullRequestEvent') prCount++;
      if (e.type === 'IssuesEvent') issueCount++;
      if (e.type === 'PushEvent') {
        pushCount++;
        const commitCount = e.payload?.size ?? e.payload?.commits?.length ?? 0;
        totalCommits += Math.max(1, commitCount); 
      }
    });
    
    const commitsPerPush = pushCount > 0 ? (totalCommits / pushCount).toFixed(1) : 0;

    // Calculate Weighted Stack
    const langScores = {};
    const now = new Date();
    safeRepos.forEach(repo => {
      if (repo.language) {
        const daysSincePush = (now - new Date(repo.pushed_at || repo.updated_at)) / (1000 * 60 * 60 * 24);
        const recencyWeight = daysSincePush < 90 ? 2 : (daysSincePush < 365 ? 1 : 0.2);
        langScores[repo.language] = (langScores[repo.language] || 0) + (repo.size * recencyWeight);
      }
    });
    const primaryStack = Object.entries(langScores).sort((a, b) => b[1] - a[1]).slice(0, 2).map(l => l[0]).join(' & ') || 'Unknown';

    return {
      profile: user,
      metrics: {
        // Identity & Network
        followers: user.followers,
        yearsActive,
        company: user.company || null,
        location: user.location || null,
        hasBlog: user.blog ? 'Yes' : null,
        hireable: user.hireable !== null ? (user.hireable ? 'Yes' : 'No') : null,
        // Architecture & Impact
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
        // Habits
        totalCommits,
        prCount,
        issueCount,
        commitsPerPush: Number(commitsPerPush),
        // Qualitative
        primaryStack
      }
    };
  };

  if (queue.length < 2) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-300 py-20 flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-3xl mb-6 shadow-xl">⚖️</div>
        <h1 className="text-2xl font-bold text-white mb-2">Comparison Radar Incomplete</h1>
        <p className="text-gray-500 mb-8">You need exactly 2 users queued to run a head-to-head analysis. Currently queued: {queue.length}</p>
        
        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-white text-gray-950 font-bold rounded-xl hover:bg-gray-200 transition">Go to Radar</button>
          {queue.length === 1 && (
            <button onClick={() => dispatch(clearCompare())} className="px-6 py-3 bg-gray-900 text-gray-400 border border-gray-800 font-bold rounded-xl hover:text-red-400 transition">Clear Queue</button>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-gray-500 font-bold animate-pulse">Running Deep Head-to-Head Diagnostics...</div>;
  if (error) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-red-500 font-bold">{error}</div>;
  if (!data) return null;

  const { user1, user2 } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4">
        
        <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black text-white">Head-to-Head Audit</h1>
          <button onClick={() => { dispatch(clearCompare()); navigate('/'); }} className="text-xs font-bold text-gray-500 hover:text-red-400 transition">Clear & Exit ✕</button>
        </div>

        {/* IDENTITY ROW */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <ProfileCard data={user1} onRemove={() => dispatch(toggleCompare(user1.profile.login))} />
          <ProfileCard data={user2} onRemove={() => dispatch(toggleCompare(user2.profile.login))} />
        </div>

        {/* 🟢 PROFESSIONAL IDENTITY & NETWORK */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="bg-gray-950/50 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
            Professional Identity & Network
          </div>
          <div className="divide-y divide-gray-800">
            <CompareRow label="Primary Tech Stack" u1={user1.metrics.primaryStack} u2={user2.metrics.primaryStack} isString={true} />
            <CompareRow label="Years Active" u1={user1.metrics.yearsActive} u2={user2.metrics.yearsActive} suffix=" yrs" />
            <CompareRow label="Followers" u1={user1.metrics.followers} u2={user2.metrics.followers} />
            
            {/* Conditional Fields: Only render if BOTH users have this data */}
            <CompareRow label="Company" u1={user1.metrics.company} u2={user2.metrics.company} isString={true} />
            <CompareRow label="Location" u1={user1.metrics.location} u2={user2.metrics.location} isString={true} />
            <CompareRow label="Personal Website" u1={user1.metrics.hasBlog} u2={user2.metrics.hasBlog} isString={true} />
            <CompareRow label="Hireable Status" u1={user1.metrics.hireable} u2={user2.metrics.hireable} isString={true} />
          </div>
        </div>

        {/* 🟢 CODEBASE ARCHITECTURE & IMPACT */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="bg-gray-950/50 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
            Codebase Architecture & Impact
          </div>
          <div className="divide-y divide-gray-800">
            <CompareRow label="Original Repositories" u1={user1.metrics.originalRepos} u2={user2.metrics.originalRepos} />
            <CompareRow label="Public Gists" u1={user1.metrics.publicGists} u2={user2.metrics.publicGists} />
            <CompareRow label="Total Stars Earned" u1={user1.metrics.totalStars} u2={user2.metrics.totalStars} />
            <CompareRow label="Total Forks" u1={user1.metrics.totalForks} u2={user2.metrics.totalForks} />
            <CompareRow label="Total Watchers" u1={user1.metrics.totalWatchers} u2={user2.metrics.totalWatchers} />
            <CompareRow label="Total Open Issues" u1={user1.metrics.totalOpenIssues} u2={user2.metrics.totalOpenIssues} />
            <CompareRow label="Total Codebase Volume" u1={Number(user1.metrics.sizeMB)} u2={Number(user2.metrics.sizeMB)} suffix=" MB" />
            <CompareRow label="Average Repo Size" u1={user1.metrics.avgRepoSizeMB} u2={user2.metrics.avgRepoSizeMB} suffix=" MB" />
            <CompareRow label="Avg Repo Health" u1={user1.metrics.avgHealth} u2={user2.metrics.avgHealth} suffix="%" />
            <CompareRow label="Open Source Score" u1={user1.metrics.osScore} u2={user2.metrics.osScore} suffix="%" />
          </div>
        </div>

        {/* 🟢 OPERATIONAL HABITS (From Events API) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="bg-gray-950/50 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
            Recent Operational Habits (Last 90 Days)
          </div>
          <div className="divide-y divide-gray-800">
            <CompareRow label="Recent Commits" u1={user1.metrics.totalCommits} u2={user2.metrics.totalCommits} />
            <CompareRow label="Avg Commits / Push" u1={user1.metrics.commitsPerPush} u2={user2.metrics.commitsPerPush} />
            <CompareRow label="PRs Opened/Reviewed" u1={user1.metrics.prCount} u2={user2.metrics.prCount} />
            <CompareRow label="Issues Interacted" u1={user1.metrics.issueCount} u2={user2.metrics.issueCount} />
          </div>
        </div>

      </div>
    </div>
  );
}

// SUB-COMPONENTS
const ProfileCard = ({ data, onRemove }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center relative group flex flex-col items-center">
    <button onClick={onRemove} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition">✕</button>
    <img src={data.profile.avatar_url} alt={data.profile.login} className="w-24 h-24 rounded-full border border-gray-700 mb-4" />
    <h2 className="text-xl font-bold text-white">{data.profile.name || data.profile.login}</h2>
    <p className="text-sm font-mono text-gray-500 mb-4">@{data.profile.login}</p>
    <a
      href={data.profile.html_url}
      target="_blank"
      rel="noreferrer"
      className="w-full max-w-[200px] py-2 bg-gray-800 text-xs font-bold rounded-lg text-white hover:bg-gray-700 transition border border-gray-700 flex items-center justify-center gap-2"
    >
      {/* GitHub Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.87 3.16 9 7.55 10.46.55.1.75-.24.75-.53 0-.26-.01-1.13-.02-2.05-3.07.67-3.72-1.48-3.72-1.48-.5-1.28-1.22-1.62-1.22-1.62-1-.68.08-.67.08-.67 1.1.08 1.68 1.14 1.68 1.14.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.48-2.45-.28-5.02-1.22-5.02-5.44 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.41.11-2.94 0 0 .92-.29 3.02 1.13a10.4 10.4 0 0 1 5.5 0c2.1-1.42 3.02-1.13 3.02-1.13.6 1.53.22 2.66.11 2.94.7.77 1.13 1.75 1.13 2.95 0 4.23-2.58 5.16-5.04 5.43.39.34.73 1.02.73 2.06 0 1.49-.01 2.69-.01 3.06 0 .29.2.64.76.53A10.52 10.52 0 0 0 23 11.5C23 5.24 18.27.5 12 .5z" />
      </svg>

      View Profile
    </a>
  </div>
);

const CompareRow = ({ label, u1, u2, suffix = "", isString = false }) => {
  // 🟢 FAIRNESS CHECK: If either user is missing this metric, do not render the row at all.
  if (u1 === null || u1 === undefined || u1 === '' || u2 === null || u2 === undefined || u2 === '') {
    return null; 
  }

  let p1Color = "text-gray-300";
  let p2Color = "text-gray-300";
  
  if (!isString) {
    if (u1 > u2) {
      p1Color = "text-emerald-400 font-black";
      p2Color = "text-gray-600";
    } else if (u2 > u1) {
      p2Color = "text-emerald-400 font-black";
      p1Color = "text-gray-600";
    } else if (u1 === u2 && u1 !== 0) {
      p1Color = "text-blue-400 font-bold";
      p2Color = "text-blue-400 font-bold";
    }
  } else {
    // Strings get neutral coloring
    p1Color = "text-gray-200 font-semibold text-sm";
    p2Color = "text-gray-200 font-semibold text-sm";
  }

  return (
    <div className="grid grid-cols-3 p-4 items-center hover:bg-gray-800/30 transition">
      <div className={`text-center font-mono text-lg ${p1Color}`}>{u1}{!isString && suffix}</div>
      <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider px-2">{label}</div>
      <div className={`text-center font-mono text-lg ${p2Color}`}>{u2}{!isString && suffix}</div>
    </div>
  );
};