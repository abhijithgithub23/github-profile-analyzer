import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { searchUsersThunk, clearSearch } from '../features/search/searchSlice';
import { githubAPI } from '../features/github/githubAPI';

export default function SearchPage() {
  const [localQuery, setLocalQuery] = useState('');
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { suggestions, loading, error, rateLimitExceeded } = useSelector(state => state.search);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!localQuery.trim()) return;

    dispatch(clearSearch());

    if (rateLimitExceeded) {
      setFallbackLoading(true);
      try {
        const exactMatch = await githubAPI.getUser(localQuery);
        if (exactMatch.status === 200) navigate(`/user/${localQuery}`);
      } catch (err) {
        console.log("Error:", err);
        alert("Search limit reached and exact user not found.");
      } finally {
        setFallbackLoading(false);
      }
    } else {
      dispatch(searchUsersThunk(localQuery));
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-950 text-gray-200 pt-20 px-4 selection:bg-blue-500/30 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-500 mb-6 tracking-tight">
            Developer <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Telemetry</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Input a GitHub target to extract codebase volume, operational habits, and ecosystem impact.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative flex flex-col sm:flex-row gap-3 bg-gray-950 p-2 rounded-2xl border border-gray-800 shadow-2xl">
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Target ID (e.g., 'torvalds')..."
              className="flex-1 bg-transparent px-5 py-4 focus:outline-none text-white text-lg placeholder-gray-600 font-mono"
            />
            <button 
              type="submit"
              disabled={loading || fallbackLoading}
              className="px-8 py-4 bg-white text-gray-950 rounded-xl font-black uppercase tracking-wider hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            >
              {loading || fallbackLoading ? 'Scanning...' : 'Extract'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-8 max-w-2xl mx-auto p-4 bg-red-950/30 text-red-400 rounded-xl border border-red-900/50 text-center font-bold tracking-wide">
            ⚠ {error}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-16 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Identified Matches</h3>
              <div className="h-px bg-gray-800 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestions.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => navigate(`/user/${user.login}`)}
                  className="bg-gray-900/40 backdrop-blur-sm p-4 rounded-2xl border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/60 cursor-pointer flex items-center gap-4 transition duration-300 group"
                >
                  <img src={user.avatar_url} alt={user.login} className="w-12 h-12 rounded-xl border border-gray-700 group-hover:border-blue-400/50 transition" />
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-bold text-white group-hover:text-blue-400 truncate transition">{user.login}</h4>
                    <p className="text-[10px] uppercase font-mono text-gray-500 group-hover:text-gray-400 mt-0.5">Initialize &rarr;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}