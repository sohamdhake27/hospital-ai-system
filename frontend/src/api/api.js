import axios from "axios";

const API_BASE_URL = "https://hospital-ai-system-3uda.onrender.com/api";

export const API = axios.create({
  baseURL: API_BASE_URL
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
