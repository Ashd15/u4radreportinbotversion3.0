import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import Viewer from './pages/Viewer'; 
import ClientDashboard from "./pages/client/ClientDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DoctorDashboard />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/coordinator" element={<CoordinatorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
