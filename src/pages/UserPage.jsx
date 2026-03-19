import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearGithubData } from '../features/github/githubSlice';
import { fetchGithubData } from '../features/github/githubThunks';
import { selectAllRepos, selectLanguageStats, selectDeveloperInsights } from '../features/github/githubSelectors';
import { toggleStar } from '../features/starred/starredSlice';
import { getFilteredRepos } from '../utils/helpers';

// --- CUSTOM DROPDOWN COMPONENT ---
const CustomSelect = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
      
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-950 text-white text-sm border border-gray-800 hover:border-blue-500/50 rounded-xl px-4 py-3 transition shadow-inner"
      >
        <span className="truncate">{currentOption.label}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-down max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <div 
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 text-sm cursor-pointer transition flex items-center justify-between ${
                  value === opt.value 
                    ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-2 border-transparent'
                }`}
              >
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function UserPage() {
  const { username } = useParams();
  const dispatch = useDispatch();
  
  const [sortBy, setSortBy] = useState('Recent');
  const [filterLang, setFilterLang] = useState('All');

  const { user, loading, error } = useSelector(state => state.github);
  const allRepos = useSelector(selectAllRepos);
  const languages = useSelector(selectLanguageStats);
  const insights = useSelector(selectDeveloperInsights);
  const isStarred = useSelector(state => state.starred.starredUsers.some(u => u.login === username));

  useEffect(() => {
    dispatch(fetchGithubData(username));
    return () => { dispatch(clearGithubData()); };
  }, [username, dispatch]);

  if (loading || !insights) return (
    <div className="flex justify-center items-center h-[80vh] bg-gray-950 text-xl font-bold text-gray-500 animate-pulse">
      <span className="text-blue-500 mr-3 animate-spin">⟳</span> Extracting telemetry & indexing codebase...
    </div>
  );
  
  if (error) return <div className="text-center mt-20 text-red-400 bg-red-950/30 p-6 rounded-xl border border-red-900 max-w-lg mx-auto">{error}</div>;
  if (!user) return null;

  const totalEvents = Object.values(insights.eventCounts).reduce((a, b) => a + b, 0) || 1;
  const displayedRepos = getFilteredRepos(allRepos, filterLang, sortBy);

  const sortOptions = [
    { value: 'Recent', label: '🕒 Most Recent' },
    { value: 'Stars', label: '⭐ Top Starred' },
    { value: 'Forks', label: '⑂ Most Forked' },
    { value: 'Size', label: '📦 Largest Size' },
  ];

  const languageOptions = [
    { value: 'All', label: '🌐 All Languages' },
    ...languages.map(l => ({ value: l.language, label: `${l.language} (${l.percentage}%)` }))
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-10 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* 🟢 TELEMETRY HEADER */}
        <div className="relative overflow-hidden bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10">
            <img src={user.avatar_url} alt={user.login} className="w-32 h-32 rounded-2xl border border-gray-700 shadow-2xl object-cover" />
            <div className={`absolute -bottom-3 -right-3 bg-gray-950 px-3 py-1.5 rounded-lg text-xs font-bold border ${insights.personaGlow}`}>
              {insights.persona}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{user.name || user.login}</h1>
              <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">ID: {user.id}</span>
            </div>
            <p className="text-gray-400 text-sm mb-5 max-w-2xl leading-relaxed">
              {user.bio || 'No biological data provided.'} • Based in {user.location || 'Unknown Sector'} • Root repo initialized in {insights.oldestRepoYear}.
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs font-mono">
              <span className="bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-md text-gray-300">👥 {user.followers} FOLL</span>
              <span className="bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-md text-gray-300">💻 {insights.uniqueLanguages} STACK</span>
              <span className="bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-md text-gray-300">📦 {insights.sizeMB} MB VOL</span>
            </div>
          </div>

          <button 
            onClick={() => dispatch(toggleStar(user))}
            className={`z-10 px-6 py-3 rounded-xl font-bold transition duration-300 border backdrop-blur-md ${
              isStarred 
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {isStarred ? '★ Tracked' : '☆ Track Entity'}
          </button>
        </div>

        {/* 🟢 DATA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-800">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Developer DNA Matrix</h3>
              <div className="space-y-5">
                <StatBar label="Code Velocity" value={insights.dna.velocity} color="bg-red-500" />
                <StatBar label="Tech Focus" value={insights.dna.focus} color="bg-blue-500" />
                <StatBar label="Maint. Index" value={insights.dna.maintenance} color="bg-emerald-500" />
                <StatBar label="Global Impact" value={insights.dna.impact} color="bg-purple-500" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-800">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Operational Habits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800/50 text-center">
                  <p className="text-2xl mb-1">{insights.scheduleIcon}</p>
                  <p className="text-white font-bold text-sm">{insights.schedule}</p>
                  <p className="text-[10px] text-gray-500 uppercase mt-1">Prime Time</p>
                </div>
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800/50 text-center">
                  <p className="text-2xl font-black text-white mb-1">{insights.commitsPerPush}</p>
                  <p className="text-gray-400 font-bold text-sm">Avg</p>
                  <p className="text-[10px] text-gray-500 uppercase mt-1">Commits/Push</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            {/* LIVE TERMINAL PULSE */}
            <div className="bg-black rounded-3xl p-6 border border-gray-800 shadow-inner overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900"></div>
              <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Activity Pulse
              </h3>
              
              <div className="space-y-3 font-mono text-sm">
                {insights.recentPulse.map((event, idx) => (
                  <div key={event.id} className="flex items-start gap-4 p-2 hover:bg-gray-900/50 rounded-lg transition">
                    <span className="text-gray-600 text-xs mt-1 w-12 shrink-0">{event.time}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${event.color}`}></div>
                    <div className="flex-1">
                      <span className="text-gray-300">{event.action} </span>
                      <span className={`font-bold ${event.text}`}>{event.repo}</span>
                    </div>
                  </div>
                ))}
                {insights.recentPulse.length === 0 && <p className="text-gray-600 italic">No recent activity detected.</p>}
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-800">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Recent Telemetry Distribution</h3>
                <span className="text-xs text-gray-600 font-mono">Last 100 Events</span>
              </div>
              <div className="w-full h-4 rounded-full overflow-hidden flex mb-4 bg-gray-800">
                <div style={{width: `${(insights.eventCounts.push / totalEvents) * 100}%`}} className="bg-blue-500 h-full"></div>
                <div style={{width: `${(insights.eventCounts.create / totalEvents) * 100}%`}} className="bg-emerald-500 h-full"></div>
                <div style={{width: `${(insights.eventCounts.pr / totalEvents) * 100}%`}} className="bg-purple-500 h-full"></div>
                <div style={{width: `${(insights.eventCounts.issue / totalEvents) * 100}%`}} className="bg-orange-500 h-full"></div>
                <div style={{width: `${(insights.eventCounts.other / totalEvents) * 100}%`}} className="bg-gray-600 h-full"></div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {insights.eventCounts.push} Pushes</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {insights.eventCounts.create} Creates</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> {insights.eventCounts.pr} PRs</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {insights.eventCounts.issue} Issues</div>
              </div>
            </div>

            {/* 🟢 NEW RE-ADDED: LANGUAGE ARCHITECTURE */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-800">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Language Architecture</h3>
              {languages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {languages.slice(0, 6).map(lang => (
                    <div key={lang.language} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-300 w-24 truncate">{lang.language}</span>
                      <div className="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gray-400 h-full rounded-full" style={{ width: `${lang.percentage}%` }}></div>
                      </div>
                      <span className="text-xs font-mono text-gray-500 w-10 text-right">{lang.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm font-mono">Insufficient architectural data.</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox value={insights.openSourceScore + '%'} label="OS Score" desc="Wiki/Issue usage" />
              <StatBox value={insights.totalStars} label="Total Stars" desc="Ecosystem impact" />
              <StatBox value={insights.totalWatchers} label="Watchers" desc="Active observers" />
              <StatBox value={insights.totalIssues} label="Open Issues" desc="Across all repos" />
            </div>
          </div>
        </div>

        {/* 🟢 FULL REPOSITORY ARSENAL WITH FILTER PANEL */}
        <div className="mt-12 pt-8 border-t border-gray-800/50">
          <div className="flex justify-between items-end mb-6 ml-2">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Repository Arsenal</h3>
            <span className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded border border-gray-800 shadow-inner">
              Showing {displayedRepos.length} of {allRepos.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* ⚙️ FILTER PANEL (Sidebar) - FIXED STICKY TOP */}
            <div className="lg:col-span-1 sticky top-28 z-20">
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span>⚙️</span> Control Panel
                </h4>
                
                <div className="space-y-6">
                  <CustomSelect 
                    label="Sort Engine"
                    value={sortBy} 
                    options={sortOptions} 
                    onChange={setSortBy} 
                  />
                  <CustomSelect 
                    label="Tech Stack Filter"
                    value={filterLang} 
                    options={languageOptions} 
                    onChange={setFilterLang} 
                  />
                </div>
              </div>
            </div>

            {/* 📦 REPOSITORIES GRID */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedRepos.map(repo => (
                  <a 
                    key={repo.id} 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block p-5 bg-gray-900/30 border border-gray-800/80 rounded-2xl hover:bg-gray-800/60 hover:border-gray-600 transition duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-full blur-2xl transition-all duration-500"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-blue-400 text-base truncate pr-4">{repo.name}</h4>
                        {repo.language && (
                          <span className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-gray-800 whitespace-nowrap">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 h-10 overflow-hidden mb-6 line-clamp-2">
                        {repo.description || 'No artifact description found.'}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-800/50 flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                        <span className="flex items-center gap-1"><span className="text-gray-400">★</span> {repo.stargazers_count}</span>
                        <span className="flex items-center gap-1"><span className="text-gray-400">⑂</span> {repo.forks_count}</span>
                        <span className="flex items-center gap-1 ml-auto text-gray-600">
                          {Math.round(repo.size / 1024)} MB
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
                
                {displayedRepos.length === 0 && (
                  <div className="md:col-span-2 py-12 text-center bg-gray-900/20 rounded-2xl border border-gray-800/50 border-dashed">
                    <p className="text-gray-500 font-mono">No artifacts match the current filter criteria.</p>
                    <button 
                      onClick={() => { setFilterLang('All'); setSortBy('Recent'); }}
                      className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-700 transition"
                    >
                      Reset Engine
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-components
const StatBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5 font-bold">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-300 font-mono">{value}%</span>
    </div>
    <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800/50">
      <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const StatBox = ({ value, label, desc }) => (
  <div className="bg-gray-900/50 backdrop-blur-md p-5 rounded-2xl border border-gray-800 flex flex-col justify-center">
    <p className="text-3xl font-black text-white mb-1">{value}</p>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-[10px] text-gray-600 mt-1 leading-tight">{desc}</p>
  </div>
);