// Controlador del Asistente IA (RAG).

export function asistenteController({ ragService }) {
  return {
    // Consulta clásica (respuesta completa de una vez).
    async consultar(req, res) {
      const { equipoId, pregunta, modo } = req.body;
      const resultado = await ragService.consultar({
        equipoId: Number(equipoId),
        pregunta,
        modo,
        usuarioId: req.user?.id ?? null,
      });
      res.json(resultado);
    },

    // Consulta en streaming. Emite NDJSON: una línea JSON por evento.
    //   { tipo: 'token', texto }   -> fragmento de respuesta
    //   { tipo: 'fuentes', fuentes } -> citas al terminar
    //   { tipo: 'error', error }   -> error durante la generación
    // No usa asyncHandler: gestionamos los errores aquí porque ya hemitimos cuerpo.
    async consultarStream(req, res) {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no'); // evita buffering en proxies (nginx)

      const enviar = (obj) => res.write(`${JSON.stringify(obj)}\n`);

      try {
        const { fuentes, fuentesWeb } = await ragService.consultarStream({
          equipoId: Number(req.body.equipoId),
          pregunta: req.body.pregunta,
          modo: req.body.modo,
          usuarioId: req.user?.id ?? null,
          onToken: (texto) => enviar({ tipo: 'token', texto }),
        });
        enviar({ tipo: 'fuentes', fuentes, fuentesWeb });
      } catch (err) {
        enviar({ tipo: 'error', error: err.message });
      } finally {
        res.end();
      }
    },

    // Genera un plan de mantenimiento preventivo del equipo.
    async plan(req, res) {
      const resultado = await ragService.generarPlan({
        equipoId: Number(req.body.equipoId),
        modo: req.body.modo,
      });
      res.json(resultado);
    },

    // Sugiere preguntas de seguimiento a partir de la última interacción.
    async sugerencias(req, res) {
      const items = await ragService.sugerencias({
        pregunta: req.body.pregunta,
        respuesta: req.body.respuesta,
      });
      res.json(items);
    },

    // Historial de consultas del usuario autenticado (paginado).
    async historial(req, res) {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;
      const items = await ragService.historial({ usuarioId: req.user.id, limit, offset });
      res.json(items);
    },
  };
}
