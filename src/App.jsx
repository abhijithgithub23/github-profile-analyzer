import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import SearchPage from './pages/SearchPage';
import UserPage from './pages/UserPage';
import StarredPage from './pages/StarredPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/user/:username" element={<UserPage />} />
          <Route path="/starred" element={<StarredPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;