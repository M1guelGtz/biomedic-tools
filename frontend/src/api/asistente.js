import { api, tokenStore } from './client.js';

export const asistenteApi = {
  // Consulta clásica (respuesta completa de una vez).
  consultar: (equipoId, pregunta, modo = 'estricto') =>
    api.post('/asistente/consultar', { equipoId, pregunta, modo }).then((r) => r.data),

  // Historial de consultas del usuario.
  historial: (limit = 20) =>
    api.get('/asistente/historial', { params: { limit } }).then((r) => r.data),

  // Plan de mantenimiento preventivo del equipo.
  plan: (equipoId, modo = 'asesor') =>
    api.post('/asistente/plan', { equipoId, modo }).then((r) => r.data),

  // Preguntas de seguimiento sugeridas.
  sugerencias: (pregunta, respuesta) =>
    api.post('/asistente/sugerencias', { pregunta, respuesta }).then((r) => r.data),

  /**
   * Consulta en streaming. Usa fetch (no axios) para leer el cuerpo por trozos.
   * Llama onToken(texto) por cada fragmento; devuelve { fuentes } al terminar.
   */
  consultarStream: async (equipoId, pregunta, onToken, modo = 'estricto') => {
    const res = await fetch(`${api.defaults.baseURL}/asistente/consultar/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStore.get()}`,
      },
      body: JSON.stringify({ equipoId, pregunta, modo }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        tokenStore.clear();
        window.location.href = '/login';
      }
      throw new Error('No se pudo conectar con el asistente');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fuentes = [];
    let fuentesWeb = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const linea = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!linea) continue;
        const evento = JSON.parse(linea);
        if (evento.tipo === 'token') onToken(evento.texto);
        else if (evento.tipo === 'fuentes') { fuentes = evento.fuentes; fuentesWeb = evento.fuentesWeb || []; }
        else if (evento.tipo === 'error') throw new Error(evento.error);
      }
    }
    return { fuentes, fuentesWeb };
  },
};
