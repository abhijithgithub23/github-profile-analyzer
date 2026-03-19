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
      {/* Locked screen height, no scrolling here */}
      <div className="h-screen w-full flex flex-col bg-gray-950 overflow-hidden"> 
        <Navbar />
        
        {/* Strict boundary for the pages. The pages inside will handle the scroll. */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/user/:username" element={<UserPage />} />
            <Route path="/starred" element={<StarredPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;