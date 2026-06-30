// Puerto (interfaz) del almacén de vectores. Implementación: Qdrant.
// Permite cambiar Qdrant por pgvector/otro sin tocar el caso de uso del RAG.

/* eslint-disable no-unused-vars */
export class IVectorStore {
  /** Crea la colección si no existe (idempotente). */
  async asegurarColeccion() {
    throw new Error('No implementado: asegurarColeccion()');
  }

  /** Inserta/actualiza puntos: [{ id, vector, payload }]. */
  async upsert(puntos) {
    throw new Error('No implementado: upsert()');
  }

  /**
   * Busca los k vectores más cercanos, filtrando por equipo.
   * @returns {Promise<Array<{ score:number, payload:object }>>}
   */
  async buscar(vector, { equipoId, topK }) {
    throw new Error('No implementado: buscar()');
  }

  /** Borra todos los puntos de un documento. */
  async eliminarPorDocumento(documentoId) {
    throw new Error('No implementado: eliminarPorDocumento()');
  }
}
