import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import Viewer from './pages/Viewer'; // Create this file with "Hello World"
import ClientDashboard from "./pages/client/ClientDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import ECGDashboard from "./pages/ecg/ECGDashboard";
import ECGPatientDashboard from "./pages/ecg/ECGPatientDashboard";
import ECGPDFDashboard from "./pages/ecg/ECGPDFDashboard";  


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DoctorDashboard />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
        <Route path="/ecg-dashboard" element={<ECGDashboard />} />
        <Route path="/ecg-patient-dashboard" element={<ECGPatientDashboard />} />
        <Route path="/ecg-pdf-dashboard" element={<ECGPDFDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;