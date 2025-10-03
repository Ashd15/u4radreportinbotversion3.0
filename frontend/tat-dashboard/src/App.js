import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ClientDashboard from "./pages/client/ClientDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import ECGDashboard from "./pages/Ecg_dashboard/Ecg_dashboard";
import ECGPatientDashboard from "./pages/Ecg_dashboard/Ecg_client_dashboard";
import ECGPDFDashboard from "./pages/Ecg_dashboard/Ecg_pdf_dashboard";  
import SuperCoordinatorPanel from "./pages/superCoordinator/SuperCoordinatorPanel";
import PatientRecordsSearch from "./pages/superCoordinator/PatientRecordsSearch";
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import Viewer from './pages/doctor/Viewer'; // Create this file with "Hello World"
import LoginPage from './pages/login/LoginPage';
import Doctorstatus from './pages/doctorstatus/doctorstatus';
import LogoutPage from './pages/logout/LogoutPage';
 
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
         <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/doctor-status" element={<Doctorstatus />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
        <Route path="/superCoordinator" element={<SuperCoordinatorPanel/>} />
        <Route path="/ecg-dashboard" element={<ECGDashboard />} />
        <Route path="/ecg-patient-dashboard" element={<ECGPatientDashboard />} />
        <Route path="/ecg-pdf-dashboard" element={<ECGPDFDashboard />} />
        <Route path="/SuperCoordinator" element={<SuperCoordinatorPanel />} />
        <Route path="/PatientRecordsSearch" element={<PatientRecordsSearch />} />
      </Routes>
    </Router>
  );
}

export default App;