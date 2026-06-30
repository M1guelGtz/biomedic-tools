// Puerto (interfaz) del repositorio de Documentos. Implementación: MySQL (Fase 2).

/* eslint-disable no-unused-vars */
export class IDocumentoRepository {
  /** @returns {Promise<import('../entities/Documento.js').Documento[]>} */
  async listarPorEquipo(equipoId) {
    throw new Error('No implementado: listarPorEquipo()');
  }

  /** Lista todos los documentos (opcionalmente por tipo) con el nombre del equipo. */
  async listarTodos({ tipo } = {}) {
    throw new Error('No implementado: listarTodos()');
  }

  /** @returns {Promise<import('../entities/Documento.js').Documento|null>} */
  async obtenerPorId(id) {
    throw new Error('No implementado: obtenerPorId()');
  }

  /** @returns {Promise<import('../entities/Documento.js').Documento>} */
  async crear(documento) {
    throw new Error('No implementado: crear()');
  }

  /** @returns {Promise<void>} */
  async actualizarEstadoIndexado(id, estado) {
    throw new Error('No implementado: actualizarEstadoIndexado()');
  }

  /** @returns {Promise<void>} actualiza estado y nº de páginas */
  async actualizarIndexado(id, estado, paginas) {
    throw new Error('No implementado: actualizarIndexado()');
  }

  /** @returns {Promise<void>} */
  async eliminar(id) {
    throw new Error('No implementado: eliminar()');
  }
}
