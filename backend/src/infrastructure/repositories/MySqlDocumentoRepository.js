// Implementación MySQL del puerto IDocumentoRepository.

import { IDocumentoRepository } from '../../domain/repositories/IDocumentoRepository.js';
import { Documento } from '../../domain/entities/Documento.js';

function filaADocumento(row) {
  return new Documento({
    id: row.id,
    equipoId: row.equipo_id,
    titulo: row.titulo,
    tipo: row.tipo,
    archivoClave: row.archivo_clave,
    nombreOriginal: row.nombre_original,
    mimeType: row.mime_type,
    tamanoBytes: row.tamano_bytes,
    hashSha256: row.hash_sha256,
    paginas: row.paginas,
    estadoIndexado: row.estado_indexado,
    subidoPor: row.subido_por,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

export class MySqlDocumentoRepository extends IDocumentoRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listarPorEquipo(equipoId) {
    const [rows] = await this.pool.query(
      'SELECT * FROM documentos WHERE equipo_id = ? ORDER BY creado_en DESC',
      [equipoId],
    );
    return rows.map(filaADocumento);
  }

  async obtenerPorId(id) {
    const [rows] = await this.pool.query('SELECT * FROM documentos WHERE id = ?', [id]);
    return rows.length ? filaADocumento(rows[0]) : null;
  }

  async listarTodos({ tipos, q, limit = 10, offset = 0 } = {}) {
    const conds = [];
    const params = [];
    if (tipos?.length) {
      conds.push(`d.tipo IN (${tipos.map(() => '?').join(',')})`);
      params.push(...tipos);
    }
    if (q) {
      conds.push('(d.titulo LIKE ? OR e.nombre LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    // Total para la paginación.
    const [[{ total }]] = await this.pool.query(
      `SELECT COUNT(*) AS total
         FROM documentos d JOIN equipos e ON e.id = d.equipo_id ${where}`,
      params,
    );

    // Página de resultados.
    const [rows] = await this.pool.query(
      `SELECT d.*, e.nombre AS equipo_nombre
         FROM documentos d JOIN equipos e ON e.id = d.equipo_id
         ${where}
        ORDER BY d.creado_en DESC
        LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );

    const items = rows.map((row) => ({ ...filaADocumento(row), equipoNombre: row.equipo_nombre }));
    return { items, total: Number(total) };
  }

  async crear(documento) {
    const [result] = await this.pool.query(
      `INSERT INTO documentos
         (equipo_id, titulo, tipo, archivo_clave, nombre_original, mime_type,
          tamano_bytes, hash_sha256, paginas, estado_indexado, subido_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documento.equipoId,
        documento.titulo,
        documento.tipo,
        documento.archivoClave,
        documento.nombreOriginal,
        documento.mimeType,
        documento.tamanoBytes,
        documento.hashSha256,
        documento.paginas,
        documento.estadoIndexado,
        documento.subidoPor,
      ],
    );
    return this.obtenerPorId(result.insertId);
  }

  async actualizarEstadoIndexado(id, estado) {
    await this.pool.query('UPDATE documentos SET estado_indexado = ? WHERE id = ?', [estado, id]);
  }

  async actualizarIndexado(id, estado, paginas) {
    await this.pool.query(
      'UPDATE documentos SET estado_indexado = ?, paginas = ? WHERE id = ?',
      [estado, paginas ?? null, id],
    );
  }

  async eliminar(id) {
    await this.pool.query('DELETE FROM documentos WHERE id = ?', [id]);
  }
}
