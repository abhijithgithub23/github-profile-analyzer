import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleStar } from '../features/starred/starredSlice';

export default function StarredPage() {
  const starredUsers = useSelector(state => state.starred.starredUsers);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Starred Profiles</h1>
      
      {starredUsers.length === 0 ? (
        <p className="text-gray-500 text-lg">No profiles starred yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {starredUsers.map(user => (
            <div key={user.login} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col">
              <img src={user.avatar_url} alt={user.login} className="w-20 h-20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-gray-900">{user.name || user.login}</h3>
              <p className="text-sm text-gray-500 mb-4">@{user.login}</p>
              
              <div className="mt-auto flex gap-2">
                <button 
                  onClick={() => navigate(`/user/${user.login}`)}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => dispatch(toggleStar(user))}
                  className="px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  title="Remove Star"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}