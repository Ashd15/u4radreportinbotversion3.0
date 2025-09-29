const API_BASE_URL = 'http://localhost:8000/api';

const CoordinatorHandler = {
  
  getCoordinators: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coordinators/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      throw error;
    }
  },

  // Get all patient data with TAT counters
  getTatCounters: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fetch-tat-counters/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('TAT Counters Data:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching TAT counters:', error);
      throw error;
    }
  },

  // Update patient status
  updatePatientStatus: async (patientId, statusData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating patient status:', error);
      throw error;
    }
  },

  // Assign radiologist to patient
   assignRadiologist: async (dicomId, radiologistUserId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assign-radiologist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dicom_id: dicomId, 
          radiologist_user_id: radiologistUserId 
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error assigning radiologist:', error);
      throw error;
    }
  },

  // Get radiologists list
  getRadiologists: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/radiologists/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Radiologists Data:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching radiologists:', error);
      throw error;
    }
  },


  replaceRadiologist: async (dicomId, radiologistUserId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/replace-radiologist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dicom_id: dicomId, 
          radiologist_user_id: radiologistUserId 
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error replacing radiologist:', error);
      throw error;
    }
  },


  getBodyParts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/body-parts/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching body parts:', error);
      throw error;
    }
  },


  

  // 🔹 Update patient details (with history file upload support)
  updatePatient: async (patientId, newData, historyFiles = null) => {
  try {
    const payload = {
      ...newData,
    };

    if (historyFiles && historyFiles.length > 0) {
      // Only names, unless you plan to send base64 content
      payload.history_files = historyFiles.map(file => file.name);
    }

    const response = await fetch(`${API_BASE_URL}/update-dicom/${patientId}/`, {
      method: 'PUT', // full update
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating patient:", error);
    throw error;
  }
}


};

export default CoordinatorHandler;
