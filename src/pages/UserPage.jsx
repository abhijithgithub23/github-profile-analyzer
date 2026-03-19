import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearGithubData } from '../features/github/githubSlice';
import { fetchGithubData } from '../features/github/githubThunks';
import {  selectDeveloperInsights } from '../features/github/githubSelectors';
import { toggleStar } from '../features/starred/starredSlice';
import { toggleCompare } from '../features/comparison/comparisonSlice';

const CustomSelect = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const currentOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-900 text-gray-200 text-sm border border-gray-800 hover:border-gray-600 rounded-lg px-3 py-2.5 transition"
      >
        <span className="truncate">{currentOption.label}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`px-3 py-2.5 text-sm cursor-pointer transition ${value === opt.value ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UserPage() {
  const { username } = useParams();
  const dispatch = useDispatch();
  
  const [sortBy, setSortBy] = useState('Algo');
  const [filterLang, setFilterLang] = useState('All');

  const { user, loading, error } = useSelector(state => state.github);
  const insights = useSelector(selectDeveloperInsights);
  
  const isStarred = useSelector(state => state.starred.starredUsers.some(u => u.login === username));
  const isQueued = useSelector(state => state.comparison.queue.includes(username));

  useEffect(() => {
    dispatch(fetchGithubData(username));
    return () => { dispatch(clearGithubData()); };
  }, [username, dispatch]);

  if (loading || !insights) return (
    <div className="h-full flex justify-center items-center bg-gray-950 text-sm text-gray-500">
      <span className="animate-spin mr-2">⟳</span> Running algorithmic profile audit...
    </div>
  );
  
  if (error) return <div className="h-full flex justify-center items-center bg-gray-950"><div className="text-center text-red-400 bg-red-900/10 p-4 rounded-lg border border-red-900/30 max-w-lg mx-auto">{error}</div></div>;
  if (!user) return null;

  const uniqueLangs = [...new Set(insights.scoredRepos.map(r => r.language).filter(Boolean))];
  const languageOptions = [
    { value: 'All', label: 'All Languages' },
    ...uniqueLangs.map(l => ({ value: l, label: l }))
  ];

  const sortOptions = [
    { value: 'Algo', label: 'Smart Sort (Best Overall)' },
    { value: 'Recent', label: 'Most Recent' },
    { value: 'Stars', label: 'Highest Stars' },
  ];

  let displayedRepos = [...insights.scoredRepos];
  if (filterLang !== 'All') displayedRepos = displayedRepos.filter(r => r.language === filterLang);
  if (sortBy === 'Algo') displayedRepos.sort((a, b) => b.algoScore - a.algoScore);
  else if (sortBy === 'Stars') displayedRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  else displayedRepos.sort((a, b) => a.daysSincePush - b.daysSincePush);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-950 text-gray-300 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 space-y-6 pb-20">
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/4 bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center">
            <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-full border border-gray-700 mb-4" />
            <h1 className="text-xl font-bold text-white tracking-tight">{user.name || user.login}</h1>
            <p className="text-gray-500 text-xs mb-4 font-mono">@{user.login}</p>
            
            <a href={user.html_url} target="_blank" rel="noreferrer" className="w-full py-2 mb-3 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition border border-gray-700">
              View on GitHub ↗
            </a>

            <button 
              onClick={() => dispatch(toggleStar(user))}
              className={`w-full py-2 mb-3 rounded-lg text-xs font-bold transition border ${
                isStarred 
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20' 
                  : 'bg-white text-gray-900 hover:bg-gray-200'
              }`}
            >
              {isStarred ? '★ Tracked (Unsave)' : '☆ Track Profile'}
            </button>

            <button 
              onClick={() => dispatch(toggleCompare(user.login))}
              className={`w-full py-2 mb-3 rounded-lg text-xs font-bold transition border ${
                isQueued 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                  : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
              }`}
            >
              {isQueued ? '⚖️ Queued for Compare (Remove)' : '⚖️ Add to Compare'}
            </button>

            <div className="mt-6 w-full text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Followers</span>
                <span className="text-gray-300 font-mono">{user.followers}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-500">Public Repos</span>
                <span className="text-gray-300 font-mono">{insights.scoredRepos.length}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <SummaryMetric label="Est. Experience" value={insights.summary.expLevel} sub={`${insights.summary.yearsActive} years active account`} />
              <SummaryMetric label="Core Stack" value={insights.summary.primaryStack} sub="Weighted by repo size & recency" />
              <SummaryMetric label="Collab Signal" value={insights.summary.collabSignal} valueColor={insights.summary.collabColor} sub="PRs vs Direct Commits" />
              <SummaryMetric label="Avg Repo Health" value={`${insights.summary.avgHealth}%`} valueColor={insights.summary.avgHealth > 60 ? 'text-emerald-400' : 'text-yellow-400'} sub="Docs, License, & Recency" />
            </div>

            <div className={`rounded-xl p-5 border ${insights.redFlags.length > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-emerald-950/20 border-emerald-900/50'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${insights.redFlags.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {insights.redFlags.length > 0 ? '⚠ Audit Warnings & Red Flags' : '✓ Clean Audit'}
              </h3>
              {insights.redFlags.length > 0 ? (
                <ul className="space-y-2">
                  {insights.redFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-200/80 flex items-start gap-2">
                      <span className="mt-0.5 text-red-500">•</span> {flag}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-200/80">No major maintenance or activity red flags detected. Consistent operational habits.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between mb-4 mt-6">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Algorithmic Best Projects</h2>
             <span className="text-xs text-gray-600">Scored via Stars + Forks + Size + Health + Recency</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.topProjects.map(repo => (
              <a 
                key={repo.id} 
                href={repo.html_url} 
                target="_blank" 
                rel="noreferrer"
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-blue-400 font-medium truncate pr-2">{repo.name}</h3>
                  <HealthBadge health={repo.health} />
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4 flex-1">
                  {repo.description || 'No description provided.'}
                </p>
                <div className="flex gap-4 text-xs font-mono text-gray-500 mt-auto pt-3 border-t border-gray-800">
                  <span>★ {repo.stargazers_count}</span>
                  <span>⑂ {repo.forks_count}</span>
                  <span className="ml-auto text-gray-600">{repo.language || 'Unknown'}</span>
                </div>
              </a>
            ))}
            {insights.topProjects.length === 0 && <p className="text-gray-600 text-sm">No public projects available.</p>}
          </div>
        </div>

        <div className="pt-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Complete Codebase Audit</h2>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            <div className="w-full lg:w-64 shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-4 uppercase">Table Controls</h3>
              <div className="space-y-5">
                <CustomSelect label="Sort Logic" value={sortBy} options={sortOptions} onChange={setSortBy} />
                <CustomSelect label="Language" value={filterLang} options={languageOptions} onChange={setFilterLang} />
              </div>
            </div>

            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden w-full">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-950/50">
                <div className="col-span-4">Repository</div>
                <div className="col-span-2">Language</div>
                <div className="col-span-2 text-right">Stars</div>
                <div className="col-span-4 text-right">Repo Health</div>
              </div>
              
              <div className="divide-y divide-gray-800">
                {displayedRepos.map(repo => (
                  <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="block p-4 hover:bg-gray-800/30 transition">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                      <div className="col-span-4">
                        <div className="font-medium text-gray-200 text-sm hover:text-blue-400 truncate">{repo.name}</div>
                        <div className="text-[10px] text-gray-600 truncate mt-0.5">Updated {repo.daysSincePush < 1 ? 'today' : `${Math.round(repo.daysSincePush)}d ago`}</div>
                      </div>
                      <div className="col-span-2 hidden md:block text-xs text-gray-500 truncate">
                        {repo.language || '-'}
                      </div>
                      <div className="col-span-2 hidden md:block text-xs font-mono text-gray-400 text-right">
                        {repo.stargazers_count}
                      </div>
                      <div className="col-span-4 hidden md:flex items-center justify-end gap-3">
                        <span className="text-xs text-gray-500">{repo.health}%</span>
                        <div className="w-24 h-1.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                          <div 
                            className={`h-full rounded-full ${repo.health >= 75 ? 'bg-emerald-500' : repo.health >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${repo.health}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {displayedRepos.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm">No repositories match the selected filters.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const SummaryMetric = ({ label, value, sub, valueColor = "text-gray-100" }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">{label}</span>
    <span className={`text-base font-bold mb-1 ${valueColor}`}>{value}</span>
    <span className="text-xs text-gray-600 leading-tight">{sub}</span>
  </div>
);

const HealthBadge = ({ health }) => {
  let color = "text-red-400 bg-red-400/10 border-red-400/20";
  let text = "Poor";
  if (health >= 75) { color = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"; text = "Excellent"; }
  else if (health >= 40) { color = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"; text = "Fair"; }
  
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${color}`}>
      {text}
    </span>
  );
};