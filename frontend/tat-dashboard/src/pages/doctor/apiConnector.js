import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const fetchTatCounters = (cursor = null) => {
  const params = { limit: 6 }; // change limit as needed
  if (cursor) params.cursor = cursor;
  return axios.get(`${API_BASE}/fetch-tat-counters/`, {
    withCredentials: true,
    params
  });
};


// Fetch personal info
export const fetchPersonalInfo = () =>
  axios.get(`${API_BASE}/personal-info/`, { withCredentials: true });