import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export const api = axios.create({ baseURL: API_BASE || undefined });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      } catch {}
    }
    return Promise.reject(err);
  }
);

export default api;
