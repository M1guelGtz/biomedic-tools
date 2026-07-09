import { api } from './client.js';

export const areasApi = {
  listar: () => api.get('/areas').then((r) => r.data),
  crear: (datos) => api.post('/areas', datos).then((r) => r.data),
  actualizar: (id, datos) => api.put(`/areas/${id}`, datos).then((r) => r.data),
  eliminar: (id) => api.delete(`/areas/${id}`),
};
