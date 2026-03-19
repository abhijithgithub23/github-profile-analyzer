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
        // Fetch User 1 Data
        const p1User = githubAPI.getUser(queue[0]);
        const p1Repos = githubAPI.getRepos(queue[0]);
        
        // Fetch User 2 Data
        const p2User = githubAPI.getUser(queue[1]);
        const p2Repos = githubAPI.getRepos(queue[1]);

        const [r1U, r1R, r2U, r2R] = await Promise.all([p1User, p1Repos, p2User, p2Repos]);

        setData({
          user1: analyzeUser(r1U.data, r1R.data),
          user2: analyzeUser(r2U.data, r2R.data)
        });

      } catch (err) {
        console.log(err);
        setError("Failed to fetch data. One of the users might not exist or rate limits were hit.");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [queue]);

  // Local Intelligence Algorithm for scoring
  const analyzeUser = (user, repos) => {
    const originalRepos = repos.filter(r => !r.fork);
    const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
    const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0);
    const totalSizeKB = repos.reduce((acc, r) => acc + r.size, 0);
    
    // Account Age
    const yearsActive = new Date().getFullYear() - new Date(user.created_at).getFullYear();
    
    // Health Index
    let healthTotal = 0;
    originalRepos.forEach(repo => {
      if (repo.description) healthTotal += 20;
      if (repo.has_issues) healthTotal += 10;
      if (repo.license) healthTotal += 10;
    });
    const avgHealth = originalRepos.length ? Math.round(healthTotal / originalRepos.length) : 0;

    return {
      profile: user,
      metrics: {
        followers: user.followers,
        publicRepos: user.public_repos,
        originalRepos: originalRepos.length,
        totalStars,
        totalForks,
        yearsActive,
        avgHealth,
        sizeMB: (totalSizeKB / 1024).toFixed(1)
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

  if (loading) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-gray-500 font-bold animate-pulse">Running Head-to-Head Diagnostics...</div>;
  if (error) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-red-500 font-bold">{error}</div>;
  if (!data) return null;

  const { user1, user2 } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-10">
      <div className="max-w-5xl mx-auto px-4">
        
        <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black text-white">Head-to-Head Audit</h1>
          <button onClick={() => dispatch(clearCompare())} className="text-xs font-bold text-gray-500 hover:text-red-400">Clear & Exit ✕</button>
        </div>

        {/* IDENTITY ROW */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <ProfileCard data={user1} onRemove={() => dispatch(toggleCompare(user1.profile.login))} />
          <ProfileCard data={user2} onRemove={() => dispatch(toggleCompare(user2.profile.login))} />
        </div>

        {/* METRICS COMPARISON TABLE */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="bg-gray-950/50 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
            Algorithmic Breakdown
          </div>
          <div className="divide-y divide-gray-800">
            <CompareRow label="Followers" u1={user1.metrics.followers} u2={user2.metrics.followers} />
            <CompareRow label="Total Stars Earned" u1={user1.metrics.totalStars} u2={user2.metrics.totalStars} />
            <CompareRow label="Total Forks" u1={user1.metrics.totalForks} u2={user2.metrics.totalForks} />
            <CompareRow label="Original Repositories" u1={user1.metrics.originalRepos} u2={user2.metrics.originalRepos} />
            <CompareRow label="Codebase Volume (MB)" u1={Number(user1.metrics.sizeMB)} u2={Number(user2.metrics.sizeMB)} suffix=" MB" />
            <CompareRow label="Avg Repo Health" u1={user1.metrics.avgHealth} u2={user2.metrics.avgHealth} suffix="%" />
            <CompareRow label="Years Active" u1={user1.metrics.yearsActive} u2={user2.metrics.yearsActive} suffix=" yrs" />
          </div>
        </div>

      </div>
    </div>
  );
}

// SUB-COMPONENTS
const ProfileCard = ({ data, onRemove }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center relative group">
    <button onClick={onRemove} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition">✕</button>
    <img src={data.profile.avatar_url} alt={data.profile.login} className="w-24 h-24 rounded-full border border-gray-700 mx-auto mb-4" />
    <h2 className="text-xl font-bold text-white">{data.profile.name || data.profile.login}</h2>
    <p className="text-sm font-mono text-gray-500 mb-4">@{data.profile.login}</p>
    <a href={data.profile.html_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 text-xs font-bold rounded-lg text-white hover:bg-gray-700 transition">View Profile ↗</a>
  </div>
);

const CompareRow = ({ label, u1, u2, suffix = "" }) => {
  // Determine winner for highlighting
  let p1Color = "text-gray-300";
  let p2Color = "text-gray-300";
  
  if (u1 > u2) {
    p1Color = "text-emerald-400 font-black";
    p2Color = "text-gray-600";
  } else if (u2 > u1) {
    p2Color = "text-emerald-400 font-black";
    p1Color = "text-gray-600";
  }

  return (
    <div className="grid grid-cols-3 p-4 items-center hover:bg-gray-800/30 transition">
      <div className={`text-center font-mono text-lg ${p1Color}`}>{u1}{suffix}</div>
      <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-center font-mono text-lg ${p2Color}`}>{u2}{suffix}</div>
    </div>
  );
};