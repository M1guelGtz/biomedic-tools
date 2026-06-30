// Puerto del repositorio de consultas al asistente (auditoría, contexto médico).

/* eslint-disable no-unused-vars */
export class IConsultaRepository {
  /** Guarda una consulta: { equipoId, usuarioId, pregunta, respuesta, fuentes }. */
  async registrar(consulta) {
    throw new Error('No implementado: registrar()');
  }

  /** Lista las consultas de un usuario (paginado, más recientes primero). */
  async listarPorUsuario(usuarioId, { limit, offset }) {
    throw new Error('No implementado: listarPorUsuario()');
  }
}
