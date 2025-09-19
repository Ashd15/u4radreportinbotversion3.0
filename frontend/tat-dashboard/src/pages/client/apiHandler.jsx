// apiHandler.jsx
const API_BASE_URL = 'http://127.0.0.1:8000/api';

class ApiHandler {
  // Generic method for making API requests
  static async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
    // Use the updated endpoint for updating: /update-dicom/<id>
    return await this.makeRequest(`/update-dicom/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Download a report file (optionally PDF/Word)
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
      return {
        success: true,
        message: 'File downloaded successfully',
      };
    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // You may add additional helper functions here if needed
}

export default ApiHandler;
