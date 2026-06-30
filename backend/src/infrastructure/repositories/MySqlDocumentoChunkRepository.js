import { IDocumentoChunkRepository } from '../../domain/repositories/IDocumentoChunkRepository.js';

export class MySqlDocumentoChunkRepository extends IDocumentoChunkRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async crearMuchos(chunks) {
    if (!chunks.length) return;
    const valores = chunks.map((c) => [
      c.documentoId,
      c.equipoId,
      c.qdrantPointId,
      c.indiceChunk,
      c.pagina,
    ]);
    await this.pool.query(
      `INSERT INTO documento_chunks
         (documento_id, equipo_id, qdrant_point_id, indice_chunk, pagina)
       VALUES ?`,
      [valores],
    );
  }

  async eliminarPorDocumento(documentoId) {
    await this.pool.query('DELETE FROM documento_chunks WHERE documento_id = ?', [documentoId]);
  }
}
