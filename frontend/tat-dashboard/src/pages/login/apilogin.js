import axios from "axios";
import { API_BASE_URL } from "../Api/apiconnector";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends cookies automatically
});

export default api;
