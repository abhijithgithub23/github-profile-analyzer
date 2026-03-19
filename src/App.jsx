import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import SearchPage from './pages/SearchPage';
import UserPage from './pages/UserPage';
import StarredPage from './pages/StarredPage';
import ComparisonPage from './pages/ComparisonPage';

function App() {
  return (
    <Router>
      {/* 🟢 Ensure bg-gray-950 is on the wrapper to prevent white flashes */}
      <div className="min-h-screen bg-gray-950"> 
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/user/:username" element={<UserPage />} />
          <Route path="/starred" element={<StarredPage />} />
          <Route path="/compare" element={<ComparisonPage />} /> {/* 🟢 ADD THIS */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;