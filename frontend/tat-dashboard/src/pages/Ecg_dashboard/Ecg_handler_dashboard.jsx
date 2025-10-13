import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create an Axios instance with same configuration as login
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 404 with HTML response (Django redirect to login page)
    if (error.response?.status === 404 && 
        typeof error.response.data === 'string' && 
        error.response.data.includes('<!DOCTYPE html>')) {
      console.error("Session expired - redirecting to login");
      localStorage.removeItem("user");
      window.location.href = '/';
      return Promise.reject({
        response: {
          status: 401,
          data: { message: "Session expired. Please login again." }
        }
      });
    }
    
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Unauthorized - redirecting to login");
      localStorage.removeItem("user");
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Utility function for error handling
const handleError = (error, defaultMsg = "Request failed. Please try again.") => {
  console.error("API Error:", error);
  if (error.response?.data?.error) {
    alert(`Error: ${error.response.data.error}`);
  } else if (error.response?.data?.message) {
    alert(`Error: ${error.response.data.message}`);
  } else {
    alert(defaultMsg);
  }
};

// ==========================================================
// ✅ FETCH / UPDATE / SEARCH PATIENTS
// ==========================================================

export const fetchTatCounters = async () => {
  try {
    const response = await api.get("/fetch-tat-counters/");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchECGPatients = async (params = {}) => {
  try {
    const response = await api.get("/ecg_patients/", { params });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateECGPatient = async (patientId, data) => {
  try {
    const response = await api.patch(`/ecg_patients/${patientId}/`, data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const markPatientAsUrgent = async (patientId, isUrgent) => {
  try {
    const response = await api.post(`/ecg_patients/${patientId}/update-status/`, {
      action: isUrgent ? "mark_urgent" : "unmark_urgent",
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchECGClient = async () => {
  try {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      return { 
        success: false, 
        message: "Not logged in. Please login first.",
        requiresLogin: true
      };
    }

    const response = await api.get('/get-ecg-client/');

    console.log("ECG Client Response:", response.data); // Debug log

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: "Invalid response format from server"
      };
    }

  } catch (error) {
    console.error("Error fetching ECG client:", error);
    
    if (error.response) {
      return { 
        success: false, 
        message: error.response.data?.message || "Failed to fetch ECG client",
        status: error.response.status,
        requiresLogin: error.response.status === 401 || error.response.status === 403
      };
    } else if (error.request) {
      return { 
        success: false, 
        message: "No response from server. Please check your connection." 
      };
    } else {
      return { 
        success: false, 
        message: error.message || "An unexpected error occurred" 
      };
    }
  }
};

export const markPatientForNonReported = async (patientId, isNonReported) => {
  try {
    const response = await api.post(`/ecg_patients/${patientId}/update-status/`, {
      action: isNonReported ? "mark_non_reported" : "unmark_non_reported",
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const updatePatientStatus = async (patientId, isDone) => {
  try {
    const response = await api.post(`/ecg_patients/${patientId}/update-status/`, { isDone });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const bulkUpdatePatients = async (patientIds, updateData) => {
  try {
    const response = await api.post("/ecg_patients/bulk_update/", {
      patient_ids: patientIds,
      update_data: updateData,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getPatientDetails = async (patientId) => {
  try {
    const response = await api.get(`/ecg_patients/${patientId}/`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const searchPatients = async (searchTerm, filters = {}) => {
  return fetchECGPatients({ search: searchTerm, ...filters });
};

// ==========================================================
// ✅ METADATA (LOCATIONS & CARDIOLOGISTS)
// ==========================================================

export const fetchLocations = async () => {
  try {
    const response = await api.get("/get-locations/");
    return response.data.locations || [];
  } catch (error) {
    console.error("Error loading locations:", error);
    return [];
  }
};

export const fetchCardiologists = async () => {
  try {
    const response = await api.get("/cardiologists/");
    return response.data.cardiologists || [];
  } catch (error) {
    console.error("Error loading cardiologists:", error);
    return [];
  }
};

// ==========================================================
// ✅ STATISTICS
// ==========================================================

export const fetchECGStats = async () => {
  try {
    const response = await api.get("/ecg_stats/");
    return response.data.stats;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      "Current Uploaded": 0,
      "Current Reported": 0,
      "Unreported Cases": 0,
      "Unallocated Cases": 0,
      "Total Uploaded Cases": 0,
      "Rejected Cases": 0
    };
  }
};

// ==========================================================
// ✅ ECG FILE UPLOADS
// ==========================================================

export const uploadECGFiles = async (files, location) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("ecg_file", file));
    formData.append("location", location);

    // Use the api instance with withCredentials instead of token
    const response = await api.post("/upload-ecg/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    handleError(error, "ECG file upload failed.");
  }
};

export const fetchPatients = async (params = {}) => {
  try {
    const response = await api.get("/get-ecg-client/", { params });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const addPatient = async (patientData) => {
  try {
    const formData = new FormData();
    Object.keys(patientData).forEach((key) => {
      if (patientData[key] !== null && patientData[key] !== undefined) {
        formData.append(key, patientData[key]);
      }
    });

    const response = await api.post("/upload-patient-ecgs/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ==========================================================
// ✅ CARDIOLOGIST MANAGEMENT
// ==========================================================

export const assignCardiologist = async (patientIds, cardiologistEmail, action = 'assign') => {
  try {
    const response = await api.post("/manage-cardiologist/", {
      patient_ids: patientIds,
      cardiologist_email: cardiologistEmail,
      action: action
    });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to assign cardiologist.");
    throw error;
  }
};

// ==========================================================
// ✅ ECG PDF REPORTS
// ==========================================================

export const fetchECGPDFReports = async (params = {}) => {
  try {
    const response = await api.get("/ecg-reports/", { params });
    return response.data || {};
  } catch (error) {
    handleError(error);
    return { success: false, error: error.message || 'Failed to fetch ECG PDF reports' };
  }
};

export const getECGPDFReportDetails = async (reportId) => {
  try {
    const response = await api.get(`/ecg-reports/${reportId}/`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const downloadECGPDFReport = async (reportId, patientName = "Patient") => {
  try {
    const response = await api.get(`/ecg-reports/download/${reportId}/`);

    if (!response.data?.url) throw new Error("File URL not available");

    const fileUrl = `${API_BASE_URL.replace("/api", "")}${response.data.url}`;
    const fileResponse = await api.get(fileUrl, {
      responseType: "blob",
    });

    const blob = new Blob([fileResponse.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ECG_Report_${patientName.replace(/\s+/g, "_")}_${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    handleError(error, "Failed to download ECG report.");
  }
};

export const viewECGPDFReport = (pdfFilePath) => {
  if (!pdfFilePath) return alert("PDF path missing");
  const fullUrl = `${API_BASE_URL.replace("/api", "")}${pdfFilePath}`;
  const newWindow = window.open(fullUrl, "_blank");
  if (!newWindow) alert("Please allow popups for this site to view the PDF.");
};

export const searchECGPDFReports = (searchTerm, filters = {}) =>
  fetchECGPDFReports({ search: searchTerm, ...filters });

// ==========================================================
// ✅ ECG REPORT PREVIEW & FINALIZATION
// ==========================================================

export const previewReport = async (patientId, doctorUsername, ecgFindings, additionalFindings, setPreviewReport) => {
  try {
    const response = await api.post("/report/preview/", {
      patient_id: patientId,
      doctor_username: doctorUsername,
      ecg_findings: ecgFindings,
      additional_findings: additionalFindings,
    });

    setPreviewReport(response.data);

    setTimeout(() => {
      const previewElement = document.querySelector('[aria-label="Close preview"]')?.closest("div");
      previewElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  } catch (error) {
    handleError(error, "Failed to generate preview.");
  }
};

export const finalizeReport = async (patientId, doctorUsername, ecgFindings, additionalFindings) => {
  try {
    const response = await api.post("/report/finalize/", {
      patient_id: patientId,
      doctor_username: doctorUsername,
      ecg_findings: ecgFindings,
      additional_findings: additionalFindings,
    });

    alert(response.data.message || "Report finalized successfully!");
    return true;
  } catch (error) {
    handleError(error, "Failed to finalize report.");
    return false;
  }
};

export const fetchPatientDetails = async (patientId, doctorUsername, setPatient) => {
  try {
    const response = await api.get(`/patients_ecg/${patientId}/`, {
      params: { username: doctorUsername },
    });
    setPatient(response.data);
  } catch (error) {
    handleError(error, "Failed to load patient details.");
  }
};