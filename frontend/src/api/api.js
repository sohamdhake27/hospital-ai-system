import axios from "axios";

const DEFAULT_API_URL = "https://hospital-ai-system-3uda.onrender.com/api";

const normalizeApiUrl = (url) => {
  const trimmedUrl = (url || DEFAULT_API_URL).replace(/\/+$/, "");
  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

export const API = axios.create({
  baseURL: normalizeApiUrl(import.meta.env.VITE_API_URL)
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
