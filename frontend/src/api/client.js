// Cliente HTTP centralizado. Adjunta el token JWT en cada petición y, si el
// backend responde 401, limpia la sesión.

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL, timeout: 15000 });

const TOKEN_KEY = 'biomed_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Adjuntar el token a cada petición.
api.interceptors.request.use((cfg) => {
  const token = tokenStore.get();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Si el token expira o es inválido, limpiar y redirigir al login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
