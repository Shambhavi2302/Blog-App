import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
let accessTokenMemory = null;

export const setAccessToken = (token) => {
  accessTokenMemory = token || null;

  if (token) {
    // Keep any legacy token out of localStorage for safer auth handling.
    localStorage.removeItem('token');
  }

  if (api.defaults.headers.common) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

export const clearAccessToken = () => {
  accessTokenMemory = null;
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

export const getAccessToken = () => {
  if (accessTokenMemory) {
    return accessTokenMemory;
  }

  const legacyToken = localStorage.getItem('token');

  if (legacyToken) {
    accessTokenMemory = legacyToken;
    localStorage.removeItem('token');
    return legacyToken;
  }

  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.setAccessToken = setAccessToken;
api.clearAccessToken = clearAccessToken;
api.getAccessToken = getAccessToken;

const refreshAccessToken = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const newToken = response.data.accessToken || response.data.token;

    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    clearAccessToken();
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
