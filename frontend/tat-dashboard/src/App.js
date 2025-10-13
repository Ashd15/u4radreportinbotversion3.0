import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ClientDashboard from "./pages/client/ClientDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import ECGDashboard from "./pages/Ecg_dashboard/Ecg_dashboard";
import ECGPatientDashboard from "./pages/Ecg_dashboard/Ecg_client_dashboard";
import ECGPDFDashboard from "./pages/Ecg_dashboard/Ecg_pdf_dashboard";  
import SuperCoordinatorPanel from "./pages/superCoordinator/SuperCoordinatorPanel";
import PatientRecordsSearch from "./pages/superCoordinator/PatientRecordsSearch";
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import Viewer from './pages/doctor/Viewer';
import LoginPage from './pages/login/LoginPage';
import Doctorstatus from './pages/doctorstatus/doctorstatus';
import LogoutPage from './pages/logout/LogoutPage';
import CardiologistDashboard from './pages/Ecg_dashboard/Ecg_reporting_dashboard';
import PatientReportPage from './pages/Ecg_dashboard/Ecg_report';
import Reviewer from './pages/Reviewer/Reviewer';

// ✅ Component to handle refresh on browser back/forward
function ForceRefreshOnBack() {
  const location = useLocation();

  useEffect(() => {
    window.onpopstate = () => {
      window.location.reload();
    };

    return () => {
      window.onpopstate = null;
    };
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      {/* 🔹 Add it once here */}
      <ForceRefreshOnBack />

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/doctor-status" element={<Doctorstatus />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/coordinator" element={<CoordinatorDashboard />} />
        <Route path="/superCoordinator" element={<SuperCoordinatorPanel/>} />
        <Route path="/ecg-dashboard" element={<ECGDashboard />} />
        <Route path="/ecg-patient-dashboard" element={<ECGPatientDashboard />} />
        <Route path="/ecg-pdf-dashboard" element={<ECGPDFDashboard />} />
        <Route path="/SuperCoordinator" element={<SuperCoordinatorPanel />} />
        <Route path="/PatientRecordsSearch" element={<PatientRecordsSearch />} />
        {/* <Route path="*" element={<LoginPage />} /> */}
        <Route path="/cardiologist-dashboard" element={<CardiologistDashboard />} />
        <Route path="/ecg-report/:patientId" element={<PatientReportPage />} />
        <Route path="/reviewer" element={<Reviewer  />} />
      </Routes>
    </Router>
  );
}

export default App;
