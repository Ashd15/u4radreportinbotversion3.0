// apiConnector.js
import ApiHandler from '../pages/client/apiHandler';

// Fetch TAT counters
export const fetchTatCounters = () =>
  ApiHandler.makeRequest('/fetch-tat-counters/');

// Fetch ECG Patients with filters
export const fetchECGPatients = (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  return ApiHandler.makeRequest(`/ecg_patients/${queryString ? `?${queryString}` : ''}`);
};

// Update patient data
export const updateECGPatient = (patientId, data) =>
  ApiHandler.makeRequest(`/ecg_patients/${patientId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Mark patient as urgent
export const markPatientAsUrgent = (patientId, isUrgent) =>
  ApiHandler.makeRequest(`/ecg_patients/${patientId}/update-status/`, {
    method: 'POST',
    body: JSON.stringify({ 
      action: isUrgent ? "mark_urgent" : "unmark_urgent"
    }),
  });

// Mark patient as non-reported
export const markPatientForNonReported = (patientId, isNonReported) =>
  ApiHandler.makeRequest(`/ecg_patients/${patientId}/update-status/`, {
    method: 'POST',
    body: JSON.stringify({ 
      action: isNonReported ? "mark_non_reported" : "unmark_non_reported"
    }),
  });

// Update patient status (done/not done)
export const updatePatientStatus = (patientId, isDone) =>
  ApiHandler.makeRequest(`/ecg_patients/${patientId}/update-status/`, {
    method: 'POST',
    body: JSON.stringify({ isDone }),
  });

// Bulk update patients
export const bulkUpdatePatients = (patientIds, updateData) =>
  ApiHandler.makeRequest('/ecg_patients/bulk_update/', {
    method: 'POST',
    body: JSON.stringify({
      patient_ids: patientIds,
      update_data: updateData,
    }),
  });

// Get patient details
export const getPatientDetails = (patientId) =>
  ApiHandler.makeRequest(`/ecg_patients/${patientId}/`);

// Export patients data (CSV, Excel, etc.)
export const exportPatientsData = (format = 'csv') =>
  ApiHandler.makeRequest('/ecg_patients/export/', {
    method: 'GET',
    responseType: 'blob',
    headers: { Accept: 'text/csv' },
    params: { format },
  });

// Search patients
export const searchPatients = (searchTerm, filters = {}) =>
  fetchECGPatients({
    search: searchTerm,
    ...filters,
  });

// Upload ECG files with location
export const uploadECGFiles = (files, locationId) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('ecg_file', file);
  });
  formData.append('location', locationId);
  return ApiHandler.makeRequest('/upload-ecg/', {
    method: 'POST',
    body: formData,
  });
};

// Fetch patients for ECG dashboard
export const fetchPatients = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });
  const queryString = queryParams.toString();
  return ApiHandler.makeRequest(`/upload-patient-ecgs/${queryString ? `?${queryString}` : ''}`);
};

// Add new patient
export const addPatient = (patientData) => {
  const formData = new FormData();
  
  // Append all form fields
  Object.keys(patientData).forEach(key => {
    if (patientData[key] !== null && patientData[key] !== undefined) {
      if (key === 'image' && patientData[key] instanceof File) {
        formData.append('image', patientData[key]);
      } else {
        formData.append(key, patientData[key]);
      }
    }
  });

  return ApiHandler.makeRequest('/upload-patient-ecgs/', {
    method: 'POST',
    body: formData,
  });
};

// ====== NEW ECG PDF REPORT FUNCTIONS ======

// Fetch ECG PDF Reports with filters and pagination
export const fetchECGPDFReports = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  return ApiHandler.makeRequest(`/ecg-pdf-report/${queryString ? `?${queryString}` : ''}`);
};

// Download ECG PDF Report
export const downloadECGPDFReport = async (reportId, patientName = 'Patient') => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/ecg-pdf-report/${reportId}/download/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ECG_Report_${patientName}_${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'File downloaded successfully' };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: error.message };
  }
};

// View ECG PDF Report (opens in new tab)
export const viewECGPDFReport = (pdfFilePath) => {
  const fullUrl = `http://127.0.0.1:8000${pdfFilePath}`;
  window.open(fullUrl, '_blank');
};

// Get ECG PDF Report details
export const getECGPDFReportDetails = (reportId) =>
  ApiHandler.makeRequest(`/ecg-pdf-report/${reportId}/`);

// Search ECG PDF Reports
export const searchECGPDFReports = (searchTerm, filters = {}) =>
  fetchECGPDFReports({
    search: searchTerm,
    ...filters,
  });