import { api } from './client.js';

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  listarUsuarios: () => api.get('/auth/usuarios').then((r) => r.data),
  crearUsuario: (datos) => api.post('/auth/usuarios', datos).then((r) => r.data),
};
