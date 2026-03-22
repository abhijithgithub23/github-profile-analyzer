import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleCompare, clearCompare } from '../features/comparison/comparisonSlice';
import { githubAPI } from '../features/github/githubAPI';
import { analyzeDeveloperProfile } from '../features/github/githubSelectors'; 

const comparisonCache = {};

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

      const cacheKey = queue.slice().sort().join('|'); 
      if (comparisonCache[cacheKey]) {
        setData(comparisonCache[cacheKey]);
        return; 
      }

      setLoading(true);
      setError(null);
      try {
        const p1User = githubAPI.getUser(queue[0]);
        const p1Repos = githubAPI.getRepos(queue[0]);
        const p1Events = githubAPI.getEvents(queue[0]);
        
        const p2User = githubAPI.getUser(queue[1]);
        const p2Repos = githubAPI.getRepos(queue[1]);
        const p2Events = githubAPI.getEvents(queue[1]);

        const [r1U, r1R, r1E, r2U, r2R, r2E] = await Promise.all([
          p1User, p1Repos, p1Events, 
          p2User, p2Repos, p2Events
        ]);

        const analyzedData = {
          user1: analyzeDeveloperProfile(r1U.data, r1R.data, r1E.data),
          user2: analyzeDeveloperProfile(r2U.data, r2R.data, r2E.data)
        };

        comparisonCache[cacheKey] = analyzedData;
        setData(analyzedData);

      } catch (err) {
        console.error("Comparison Fetch Error:", err);
        setError("Failed to fetch data. One of the users might not exist or API rate limits were hit.");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [queue]);

  if (queue.length < 2) {
    return (
      <div className="h-full bg-gray-950 text-gray-300 py-20 flex flex-col items-center">
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

  if (loading) return <div className="h-full bg-gray-950 flex justify-center items-center text-gray-500 font-bold animate-pulse">Running Deep Head-to-Head Diagnostics...</div>;
  if (error) return <div className="h-full bg-gray-950 flex justify-center items-center text-red-500 font-bold">{error}</div>;
  if (!data) return null;

  const { user1, user2 } = data;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-950 text-gray-300 py-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 pb-20">
        
        <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black text-white">Head-to-Head Audit</h1>
          <button onClick={() => { dispatch(clearCompare()); navigate('/'); }} className="text-xs font-bold text-gray-500 hover:text-red-400 transition">Clear & Exit ✕</button>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <ProfileCard data={user1} onRemove={() => dispatch(toggleCompare(user1.profile.login))} />
          <ProfileCard data={user2} onRemove={() => dispatch(toggleCompare(user2.profile.login))} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="bg-gray-950/50 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
            Professional Identity & Network
          </div>
          <div className="divide-y divide-gray-800">
            <CompareRow label="Primary Tech Stack" u1={user1.metrics.primaryStack} u2={user2.metrics.primaryStack} isString={true} />
            <CompareRow label="Years Active" u1={user1.metrics.yearsActive} u2={user2.metrics.yearsActive} suffix=" yrs" />
            <CompareRow label="Followers" u1={user1.metrics.followers} u2={user2.metrics.followers} />
            <CompareRow label="Company" u1={user1.metrics.company} u2={user2.metrics.company} isString={true} />
            <CompareRow label="Location" u1={user1.metrics.location} u2={user2.metrics.location} isString={true} />
            <CompareRow label="Personal Website" u1={user1.metrics.hasBlog} u2={user2.metrics.hasBlog} isString={true} />
            <CompareRow label="Hireable Status" u1={user1.metrics.hireable} u2={user2.metrics.hireable} isString={true} />
          </div>
        </div>

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
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="opacity-90">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
      View Profile
    </a>
  </div>
);

const CompareRow = ({ label, u1, u2, suffix = "", isString = false }) => {
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