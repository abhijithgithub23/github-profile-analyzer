import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearGithubData } from '../features/github/githubSlice';
import { fetchGithubData } from '../features/github/githubThunks';import { selectTopRepos, selectLanguageStats, selectActivityScore } from '../features/github/githubSelectors';
import { toggleStar } from '../features/starred/starredSlice';
import { formatNumber } from '../utils/helpers';

export default function UserPage() {
  const { username } = useParams();
  const dispatch = useDispatch();
  
  const { user, loading, error, repos } = useSelector(state => state.github);
  const topRepos = useSelector(selectTopRepos);
  const languages = useSelector(selectLanguageStats);
  const activity = useSelector(selectActivityScore);
  const isStarred = useSelector(state => state.starred.starredUsers.some(u => u.login === username));

  useEffect(() => {
    dispatch(fetchGithubData(username));
    return () => { dispatch(clearGithubData()); };
  }, [username, dispatch]);

  if (loading) return <div className="text-center mt-20 text-xl font-medium text-gray-600">Loading analysis...</div>;
  if (error) return <div className="text-center mt-20 text-red-600 bg-red-50 p-6 rounded-lg max-w-lg mx-auto border border-red-200">{error}</div>;
  if (!user) return null;

  const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Profile Sidebar */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <img src={user.avatar_url} alt={user.login} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-50" />
          <h2 className="text-2xl font-bold text-gray-900">{user.name || user.login}</h2>
          <p className="text-gray-500 mb-4">@{user.login}</p>
          <button 
            onClick={() => dispatch(toggleStar(user))}
            className={`w-full py-2 rounded-lg font-medium transition ${isStarred ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {isStarred ? '⭐ Starred Profile' : '☆ Star Profile'}
          </button>
          
          <div className="mt-6 text-left space-y-3 text-sm">
            {user.bio && <p className="text-gray-700 italic">"{user.bio}"</p>}
            <p className="text-gray-600">📍 {user.location || 'Unknown'}</p>
            <p className="text-gray-600">👥 {formatNumber(user.followers)} followers · {formatNumber(user.following)} following</p>
            <a href={user.html_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block mt-4">
              View on GitHub →
            </a>
          </div>
        </div>
      </div>

      {/* Main Analysis Content */}
      <div className="md:col-span-2 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Public Repos" value={user.public_repos} />
          <StatBox label="Total Stars" value={topRepos.reduce((acc, r) => acc + r.stargazers_count, 0) + '+'} />
          <StatBox label="Total Forks" value={totalForks} />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
             <span className="text-gray-500 text-sm mb-1">Activity Level</span>
             <span className={`text-xl font-bold ${activity.level === 'High' ? 'text-green-600' : activity.level === 'Medium' ? 'text-yellow-600' : 'text-gray-600'}`}>
               {activity.level}
             </span>
          </div>
        </div>

        {/* Top Repositories */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Repositories</h3>
          <div className="space-y-4">
            {topRepos.map(repo => (
              <div key={repo.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline">
                    {repo.name}
                  </a>
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    ⭐ {repo.stargazers_count}
                  </span>
                </div>
                {repo.description && <p className="text-sm text-gray-500 mt-2 truncate">{repo.description}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Language Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Most Used Languages</h3>
          <div className="space-y-3">
            {languages.map(lang => (
              <div key={lang.language}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{lang.language}</span>
                  <span className="text-gray-500">{lang.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${lang.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {languages.length === 0 && <p className="text-gray-500 text-sm">No language data available.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}

const StatBox = ({ label, value }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
    <span className="text-gray-500 text-sm mb-1">{label}</span>
    <span className="text-2xl font-bold text-gray-900">{value}</span>
  </div>
);