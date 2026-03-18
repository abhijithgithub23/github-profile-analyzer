import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { searchUsersThunk, clearSearch } from '../features/search/searchSlice';
import { githubAPI } from '../features/github/githubAPI';

export default function SearchPage() {
  const [localQuery, setLocalQuery] = useState('');
  const [isExactChecking, setIsExactChecking] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { suggestions, loading, error, rateLimitExceeded } = useSelector(state => state.search);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!localQuery.trim()) return;

    dispatch(clearSearch());
    setIsExactChecking(true);

    try {
      // 1. Try exact match first
      const exactMatch = await githubAPI.getUser(localQuery);
      if (exactMatch.status === 200) {
        navigate(`/user/${localQuery}`);
        return;
      }
    } catch (err) {
        console.log("Error: ", err);
      // 2. Exact match failed. If we aren't rate limited, search similar users.
      if (!rateLimitExceeded) {
        dispatch(searchUsersThunk(localQuery));
      }
    } finally {
      setIsExactChecking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Find GitHub Developers</h1>
        <p className="text-gray-600">Analyze repositories, activity, and languages.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Enter a GitHub username..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit"
          disabled={loading || isExactChecking}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isExactChecking || loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <h3 className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">Similar Users</h3>
          <ul className="divide-y divide-gray-200">
            {suggestions.map(user => (
              <li 
                key={user.id} 
                onClick={() => navigate(`/user/${user.login}`)}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full" />
                <span className="font-medium text-gray-900">{user.login}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {!loading && suggestions.length === 0 && localQuery && !error && !isExactChecking && (
         <div className="mt-6 text-center text-gray-500">No users found.</div>
      )}
    </div>
  );
}