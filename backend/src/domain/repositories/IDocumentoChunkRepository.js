// Puerto del repositorio de chunks (trazabilidad del RAG en MySQL).

/* eslint-disable no-unused-vars */
export class IDocumentoChunkRepository {
  /** Inserta varias filas de chunk: [{ documentoId, equipoId, qdrantPointId, indiceChunk, pagina }]. */
  async crearMuchos(chunks) {
    throw new Error('No implementado: crearMuchos()');
  }

  async eliminarPorDocumento(documentoId) {
    throw new Error('No implementado: eliminarPorDocumento()');
  }
}
