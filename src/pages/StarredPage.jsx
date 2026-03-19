import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleStar } from '../features/starred/starredSlice';
import { toggleCompare } from '../features/comparison/comparisonSlice'; // 🟢 NEW IMPORT

export default function StarredPage() {
  const starredUsers = useSelector(state => state.starred.starredUsers);
  const comparisonQueue = useSelector(state => state.comparison.queue); // 🟢 NEW STATE
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-10 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Tracked Entities</h1>
            <p className="text-sm font-mono text-gray-500">Profiles saved for rapid telemetry access.</p>
          </div>
          <span className="mt-4 md:mt-0 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl text-xs font-bold text-gray-400">
            Total Tracked: {starredUsers.length}
          </span>
        </div>
        
        {starredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/20 rounded-3xl border border-gray-800/50 border-dashed">
             <span className="text-4xl mb-4 opacity-50">📡</span>
             <p className="text-gray-500 font-mono">No entities currently tracked.</p>
             <button 
               onClick={() => navigate('/')}
               className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold border border-gray-700 hover:bg-gray-800 transition"
             >
               Return to Radar
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {starredUsers.map(user => {
              const isQueued = comparisonQueue.includes(user.login); // 🟢 Check if queued

              return (
                <div key={user.login} className="bg-gray-900/50 backdrop-blur-md p-6 rounded-3xl border border-gray-800 text-center flex flex-col relative group hover:border-blue-500/30 transition duration-300">
                  {/* Ambient glow on hover */}
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-3xl transition duration-500 pointer-events-none"></div>

                  <img 
                    src={user.avatar_url} 
                    alt={user.login} 
                    className="w-20 h-20 rounded-2xl mx-auto mb-4 border border-gray-700 shadow-xl group-hover:border-blue-400/50 transition duration-300" 
                  />
                  
                  <h3 className="font-black text-white text-lg truncate">{user.name || user.login}</h3>
                  <p className="text-xs font-mono text-gray-500 mb-6 truncate">@{user.login}</p>
                  
                  <div className="mt-auto flex flex-col gap-2 relative z-10">
                    {/* Primary Action */}
                    <button 
                      onClick={() => navigate(`/user/${user.login}`)}
                      className="w-full bg-white/5 border border-white/10 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-950 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition duration-300"
                    >
                      Analyze
                    </button>
                    
                    {/* Secondary Actions Row */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => dispatch(toggleCompare(user.login))}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition duration-300 border ${
                          isQueued 
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30' 
                            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {isQueued ? '⚖️ Queued' : '⚖️ Compare'}
                      </button>
                      <button 
                        onClick={() => dispatch(toggleStar(user))}
                        className="px-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition duration-300"
                        title="Stop Tracking"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}