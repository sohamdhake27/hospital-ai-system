import axios from "axios";

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || "";
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "");

export const API = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api"
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
