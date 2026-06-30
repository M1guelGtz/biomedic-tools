// Funciones de acceso a la API de equipos. Centralizan las llamadas para que
// los componentes no usen axios directamente.

import { api } from './client.js';

export const equiposApi = {
  listar: () => api.get('/equipos').then((r) => r.data),
  obtener: (id) => api.get(`/equipos/${id}`).then((r) => r.data),
  crear: (datos) => api.post('/equipos', datos).then((r) => r.data),
  actualizar: (id, datos) => api.put(`/equipos/${id}`, datos).then((r) => r.data),
  eliminar: (id) => api.delete(`/equipos/${id}`),
};
