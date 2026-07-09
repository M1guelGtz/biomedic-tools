// Funciones de acceso a la API de equipos. Centralizan las llamadas para que
// los componentes no usen axios directamente.

import { api } from './client.js';

export const equiposApi = {
  listar: () => api.get('/equipos').then((r) => r.data),
  obtener: (id) => api.get(`/equipos/${id}`).then((r) => r.data),
  crear: (datos) => api.post('/equipos', datos).then((r) => r.data),
  actualizar: (id, datos) => api.put(`/equipos/${id}`, datos).then((r) => r.data),
  eliminar: (id) => api.delete(`/equipos/${id}`),

  // Sube/reemplaza la imagen del equipo (multipart).
  subirImagen: (id, file) => {
    const form = new FormData();
    form.append('imagen', file);
    return api
      .post(`/equipos/${id}/imagen`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

  // URL absoluta de la imagen para usar en <img src>. Añade un "cache-buster"
  // basado en la fecha de actualización para ver la imagen nueva tras subirla.
  imagenSrc: (eq) => {
    const base = api.defaults.baseURL;
    const t = eq?.actualizadoEn ? new Date(eq.actualizadoEn).getTime() : '';
    return `${base}/equipos/${eq.id}/imagen${t ? `?t=${t}` : ''}`;
  },
};
