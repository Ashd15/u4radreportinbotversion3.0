import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import Viewer from './pages/Viewer'; // Create this file with "Hello World"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DoctorDashboard />} />
        <Route path="/viewer" element={<Viewer />} />
      </Routes>
    </Router>
  );
}

export default App;
