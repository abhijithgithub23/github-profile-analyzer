import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearGithubData } from '../features/github/githubSlice';
import { fetchGithubData } from '../features/github/githubThunks';
import { selectTopRepos, selectLanguageStats, selectDeveloperInsights } from '../features/github/githubSelectors';
import { toggleStar } from '../features/starred/starredSlice';

export default function UserPage() {
  const { username } = useParams();
  const dispatch = useDispatch();
  
  const { user, loading, error } = useSelector(state => state.github);
  const topRepos = useSelector(selectTopRepos);
  const languages = useSelector(selectLanguageStats);
  const insights = useSelector(selectDeveloperInsights);
  const isStarred = useSelector(state => state.starred.starredUsers.some(u => u.login === username));

  useEffect(() => {
    dispatch(fetchGithubData(username));
    return () => { dispatch(clearGithubData()); };
  }, [username, dispatch]);

  if (loading || !insights) return (
    <div className="flex justify-center items-center h-64 text-xl font-bold text-gray-400 animate-pulse">
      Crunching developer data...
    </div>
  );
  
  if (error) return <div className="text-center mt-20 text-red-600 bg-red-50 p-6 rounded-xl max-w-lg mx-auto">{error}</div>;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 🟢 TOP DASHBOARD HEADER */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        <img src={user.avatar_url} alt={user.login} className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-sm" />
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
            <h1 className="text-3xl font-extrabold text-gray-900">{user.name || user.login}</h1>
            <span className={`px-4 py-1 rounded-full text-sm font-bold ${insights.personaColor}`}>
              {insights.persona}
            </span>
          </div>
          <p className="text-gray-500 text-lg mb-4">@{user.login} • {user.location || 'Remote'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-medium text-gray-600">
            <span>👥 {user.followers} Followers</span>
            <span>🌐 {insights.uniqueLanguages} Languages Mastered</span>
            <a href={user.html_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Raw Profile ↗</a>
          </div>
        </div>
        <button 
          onClick={() => dispatch(toggleStar(user))}
          className={`px-6 py-3 rounded-xl font-bold shadow-sm transition ${isStarred ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
        >
          {isStarred ? '⭐ Saved to Favorites' : '☆ Save Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🟢 LEFT COLUMN: METRICS & HABITS */}
        <div className="space-y-8">
          {/* Impact Overview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Impact Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-2xl font-black text-gray-900">{insights.totalStars}</p>
                <p className="text-xs text-gray-500 font-medium">Total Stars Earned</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-2xl font-black text-gray-900">{insights.avgStars}</p>
                <p className="text-xs text-gray-500 font-medium">Avg Stars / Repo</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl col-span-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-black text-blue-700">{insights.originalCount}</p>
                    <p className="text-sm text-blue-600 font-medium">Original Repositories</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-500">{insights.forkedCount}</p>
                    <p className="text-xs text-gray-400">Forks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Habits */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Habits (Last 100 Events)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600 font-medium">Commits Pushed</span>
                <span className="font-bold text-gray-900">{insights.totalRecentCommits}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600 font-medium">PRs Opened</span>
                <span className="font-bold text-gray-900">{insights.prsOpened}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Issues Created</span>
                <span className="font-bold text-gray-900">{insights.issuesCreated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 RIGHT COLUMN: REPOS & LANGUAGES */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Language Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Language Dominance</h3>
            {languages.length > 0 ? (
              <div className="space-y-4">
                {languages.slice(0, 5).map(lang => (
                  <div key={lang.language}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-gray-700">{lang.language}</span>
                      <span className="text-gray-500 font-medium">{lang.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-gray-900 h-3 rounded-full" style={{ width: `${lang.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Not enough data to analyze languages.</p>
            )}
          </div>

          {/* Top Repositories Showcase */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Top Starred Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topRepos.map(repo => (
                <a 
                  key={repo.id} 
                  href={repo.html_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-5 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition bg-gray-50 hover:bg-white"
                >
                  <h4 className="font-bold text-blue-700 text-lg mb-2 truncate">{repo.name}</h4>
                  <p className="text-sm text-gray-500 h-10 overflow-hidden mb-4">{repo.description || 'No description provided.'}</p>
                  <div className="flex gap-4 text-xs font-bold text-gray-600">
                    <span className="flex items-center gap-1">⭐ {repo.stargazers_count}</span>
                    <span className="flex items-center gap-1">🔄 {repo.forks_count}</span>
                    {repo.language && <span className="flex items-center gap-1">💻 {repo.language}</span>}
                  </div>
                </a>
              ))}
            </div>
            {topRepos.length === 0 && <p className="text-gray-500 italic">No public repositories found.</p>}
          </div>

        </div>
      </div>
    </div>
  );
}