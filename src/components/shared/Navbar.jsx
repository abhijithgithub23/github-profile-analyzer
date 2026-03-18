import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Navbar() {
  const starredCount = useSelector(state => state.starred.starredUsers.length);

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
          <span>GitHub Analyzer</span>
        </Link>
        <Link to="/starred" className="font-medium hover:text-blue-400 transition">
          ⭐ Starred ({starredCount})
        </Link>
      </div>
    </nav>
  );
}