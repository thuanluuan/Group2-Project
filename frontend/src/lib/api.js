import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "";

export const api = axios.create({ baseURL: API_BASE || undefined, withCredentials: false });
const authApi = axios.create({ baseURL: API_BASE || undefined, withCredentials: true });

// Helper: logout on backend to clear refresh cookie
export async function logoutBackend() {
  try {
    await authApi.post('/auth/logout');
  } catch {
    // ignore
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function onRefreshed(newToken) {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err?.config;
    if (err?.response?.status === 401 && !original?._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const r = await authApi.post('/auth/refresh');
          const newToken = r?.data?.accessToken || r?.data?.token;
          if (newToken) {
            localStorage.setItem('auth_token', newToken);
            onRefreshed(newToken);
          } else {
            throw new Error('No access token');
          }
        } catch (e) {
          try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          } catch {}
          isRefreshing = false;
          return Promise.reject(err);
        }
        isRefreshing = false;
      }
      return new Promise((resolve) => {
        pendingQueue.push((token) => {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }
    return Promise.reject(err);
  }
);

export default api;
