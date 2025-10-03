import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const fetchTatCounters = () =>
  axios.get(`${API_BASE}/fetch-tat-counters/`, { withCredentials: true });


// Fetch personal info
export const fetchPersonalInfo = () =>
  axios.get(`${API_BASE}/personal-info/`, { withCredentials: true });