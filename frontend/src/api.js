import axios from 'axios';

// Reads the backend origin from the build-time env var (frontend/.env's
// VITE_API_BASE_URL, also injected via --build-arg in CI) instead of a
// hardcoded IP, so changing .env actually has an effect.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: `${API_ORIGIN}/api`
});

export const API_BASE_URL = API_ORIGIN;

// Auto-attach session token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['X-Auth-Token'] = token;
  }
  return config;
});

export const fmt = (val) =>
  val !== undefined && val !== null
    ? Number(val).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    : '0.00';

export const today = () => new Date().toISOString().split('T')[0];

export default API;
