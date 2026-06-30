import { api } from './client.js';

export const documentosApi = {
  listarPorEquipo: (equipoId) =>
    api.get(`/equipos/${equipoId}/documentos`).then((r) => r.data),

  subir: (equipoId, { archivo, titulo, tipo }) => {
    const form = new FormData();
    form.append('archivo', archivo);
    if (titulo) form.append('titulo', titulo);
    if (tipo) form.append('tipo', tipo);
    return api
      .post(`/equipos/${equipoId}/documentos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  eliminar: (id) => api.delete(`/documentos/${id}`),

  reindexar: (id) => api.post(`/documentos/${id}/reindexar`).then((r) => r.data),

  // Listado global paginado (Manuales / Normativas).
  // params: { tipo:'manual,datasheet', q, page, pageSize }
  listarTodos: (params = {}) =>
    api.get('/documentos', { params }).then((r) => r.data),

  // Descarga el PDF con el token de sesión (un <a href> no enviaría el header)
  // y lo abre en una pestaña nueva como blob.
  abrir: async (id) => {
    const r = await api.get(`/documentos/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    window.open(url, '_blank', 'noopener');
    // Liberar el object URL un poco después de abrir.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
};
