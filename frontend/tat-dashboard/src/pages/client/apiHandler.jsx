// apiHandler.jsx
const API_BASE_URL = 'http://127.0.0.1:8000/api';

class ApiHandler {
  // Generic method for making API requests
  static async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Detect if body is FormData (for file uploads)
    const isFormData = options.body instanceof FormData;

    const defaultOptions = {
      headers: isFormData
        ? { ...options.headers } // Do NOT set Content-Type for FormData
        : { 'Content-Type': 'application/json', ...options.headers },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // For file downloads, return blob directly
      if (options.responseType === 'blob') {
        const blob = await response.blob();
        return { success: true, data: blob, status: response.status };
      }

      // If response is empty, return success without data
      if (response.status === 204) {
        return { success: true, data: null, status: response.status };
      }

      const data = await response.json();
      return { success: true, data, status: response.status };

    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error.message,
        status: error.status || 500,
      };
    }
  }

  // Get all patient DICOM reports
  static async getDicomReports() {
    return await this.makeRequest('/dicom-list/');
  }

  // Update a patient DICOM report
  static async updateDicomReport(id, data) {
    return await this.makeRequest(`/update-dicom/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Download a report file (PDF/Word)
  static async downloadReport(reportId, format = 'pdf') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/download-report/${reportId}/?format=${format}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'File downloaded successfully' };
    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error: error.message };
    }
  }
  

static async uploadHistoryFile(dicomId, historyFiles) {
  const formData = new FormData();

  // Attach DICOM data (adjust if a different object/format is required)
  formData.append('dicom_data', dicomId);

  // Attach all files, allowing multiple files
  if (Array.isArray(historyFiles)) {
    historyFiles.forEach(file => {
      formData.append('history_file', file);
    });
  } else if (historyFiles) {
    formData.append('history_file', historyFiles);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/upload-historyfile/${dicomId}/`, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type—it is set automatically for FormData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    console.error('History file upload failed:', error);
    return { success: false, error: error.message, status: error.status || 500 };
  }
}

  // Additional helper for POSTing FormData (like ECG uploads)
  static async postFormData(endpoint, formData) {
    return await this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

export default ApiHandler;
