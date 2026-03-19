import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Navbar() {
  const starredCount = useSelector(state => state.starred.starredUsers.length);
  const compareCount = useSelector(state => state.comparison.queue.length);

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] transition duration-300">
            <span className="text-white font-black text-sm">/&gt;</span>
          </div>
          <span className="font-black text-xl tracking-tight text-white group-hover:text-blue-400 transition">
            Dev<span className="text-gray-500">Analyzer</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/compare" 
            className={`flex items-center gap-2 font-bold text-sm transition px-4 py-2 rounded-xl shadow-inner border ${compareCount === 2 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}
          >
            <span>⚖️ Compare</span>
            <span className="bg-gray-950 border border-gray-700 px-2 py-0.5 rounded-md text-gray-300">{compareCount}/2</span>
          </Link>

          <Link 
            to="/starred" 
            className="flex items-center gap-2 font-bold text-sm text-gray-400 hover:text-yellow-400 transition bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl shadow-inner hover:border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <span>★ Tracked</span>
            <span className="bg-gray-950 border border-gray-700 px-2 py-0.5 rounded-md text-gray-300">{starredCount}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}