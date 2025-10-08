import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Fetch patient details by ID
 * @param {string} patientId - The patient ID
 * @param {string} doctorUsername - The doctor's username
 * @param {Function} setPatient - State setter for patient data
 */
export const fetchPatientDetails = async (patientId, doctorUsername, setPatient) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/patients_ecg/${patientId}/?username=${doctorUsername}`
    );
    setPatient(response.data);
  } catch (error) {
    console.error("Error fetching patient details:", error);
    alert("Failed to load patient details. Please try again.");
  }
};

/**
 * Preview the report before finalizing
 * @param {number} patientId - The patient ID
 * @param {string} doctorUsername - The doctor's username
 * @param {string} ecgFindings - ECG findings text
 * @param {string} additionalFindings - Additional findings text
 * @param {Function} setPreviewReport - State setter for preview data
 */
export const previewReport = async (
  patientId,
  doctorUsername,
  ecgFindings,
  additionalFindings,
  setPreviewReport
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/report/preview/`, {
      patient_id: patientId,
      doctor_username: doctorUsername,
      ecg_findings: ecgFindings,
      additional_findings: additionalFindings,
    });
    
    setPreviewReport(response.data);
    
    // Scroll to preview section
    setTimeout(() => {
      const previewElement = document.querySelector('[aria-label="Close preview"]')?.closest('div');
      if (previewElement) {
        previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  } catch (error) {
    console.error("Error generating preview:", error);
    
    if (error.response?.data?.error) {
      alert(`Error: ${error.response.data.error}`);
    } else if (error.response?.data?.message) {
      alert(`Error: ${error.response.data.message}`);
    } else {
      alert("Failed to generate preview. Please check your inputs and try again.");
    }
  }
};

/**
 * Finalize and save the report
 * @param {number} patientId - The patient ID
 * @param {string} doctorUsername - The doctor's username
 * @param {string} ecgFindings - ECG findings text
 * @param {string} additionalFindings - Additional findings text
 * @returns {boolean} Success status
 */
export const finalizeReport = async (
  patientId,
  doctorUsername,
  ecgFindings,
  additionalFindings
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/report/finalize/`, {
      patient_id: patientId,
      doctor_username: doctorUsername,
      ecg_findings: ecgFindings,
      additional_findings: additionalFindings,
    });
    
    alert(response.data.message || "Report finalized successfully!");
    return true;
  } catch (error) {
    console.error("Error finalizing report:", error);
    
    if (error.response?.data?.error) {
      alert(`Error: ${error.response.data.error}`);
    } else if (error.response?.data?.message) {
      alert(`Error: ${error.response.data.message}`);
    } else {
      alert("Failed to finalize report. Please try again.");
    }
    
    return false;
  }
};