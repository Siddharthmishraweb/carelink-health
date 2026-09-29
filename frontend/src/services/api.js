import axios from 'axios';
import { io } from 'socket.io-client';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const saved = JSON.parse(localStorage.getItem('carelink.auth') || 'null');
  if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('carelink.auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function connectSocket(query = {}) {
  const saved = JSON.parse(localStorage.getItem('carelink.auth') || 'null');
  return io('/', {
    path: '/socket.io',
    auth: { token: saved?.token },
    query,
  });
}

export default api;
