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
      // Fallback: If rate limited, bypass search API and try exact match directly
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
      // Normal Flow: Get list of matches
      dispatch(searchUsersThunk(localQuery));
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          GitHub Developer <span className="text-blue-600">Analyzer</span>
        </h1>
        <p className="text-gray-500 text-lg">Uncover deep insights, commit habits, and developer personas.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search for an account (e.g., 'facebook', 'torvalds')..."
          className="flex-1 px-5 py-4 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
        <button 
          type="submit"
          disabled={loading || fallbackLoading}
          className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-sm"
        >
          {loading || fallbackLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center font-medium">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Matching Accounts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {suggestions.map(user => (
              <div 
                key={user.id} 
                onClick={() => navigate(`/user/${user.login}`)}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer flex items-center gap-4 transition group"
              >
                <img src={user.avatar_url} alt={user.login} className="w-14 h-14 rounded-full border border-gray-100" />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 truncate">{user.login}</h4>
                  <p className="text-xs text-gray-500">View Analytics →</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}