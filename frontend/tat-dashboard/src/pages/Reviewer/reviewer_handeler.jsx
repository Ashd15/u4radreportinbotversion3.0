// reviewer_handlers.js

const API_BASE_URL = 'http://localhost:8000/api';

const apiHandlers = {
  // Fetch all radiologists
  fetchRadiologists: async () => {
    const response = await fetch(`${API_BASE_URL}/radiologists/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch radiologists');
    return await response.json();
  },

  // Fetch all patients
  fetchPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/review_patient/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch patients');
    return await response.json();
  },

  // Release a patient
  releasePatient: async (dbId, username) => {
    const response = await fetch(`${API_BASE_URL}/release_patient/${dbId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed_by: username }),
    });
    if (!response.ok) throw new Error('Failed to release patient');
    return await response.json();
  },

  // Assign radiologist
  assignRadiologist: async (dicomId, radiologistUserId) => {
    const response = await fetch(`${API_BASE_URL}/assign-radiologist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dicom_id: dicomId,
        radiologist_user_id: radiologistUserId,
      }),
    });
    if (!response.ok) throw new Error('Failed to assign radiologist');
    return await response.json();
  },

  // Replace radiologist
  replaceRadiologist: async (dicomId, radiologistUserId) => {
    const response = await fetch(`${API_BASE_URL}/replace-radiologist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dicom_id: dicomId,
        radiologist_user_id: radiologistUserId,
      }),
    });
    if (!response.ok) throw new Error('Failed to replace radiologist');
    return await response.json();
  },
   // Reassign patient with reason
  reassignPatient: async (dbId, reviewReason) => {
    const response = await fetch(`${API_BASE_URL}/reassign_case/${dbId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': localStorage.getItem('csrfToken') || '',
      },
      body: JSON.stringify({ review_reason: reviewReason }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reassign patient');
    return data;
  },
};

export default apiHandlers;
