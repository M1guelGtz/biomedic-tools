// Implementación MySQL del puerto IEquipoRepository.
// Es el ÚNICO lugar (junto al pool) que conoce SQL para equipos.

import { IEquipoRepository } from '../../domain/repositories/IEquipoRepository.js';
import { Equipo } from '../../domain/entities/Equipo.js';

/** Convierte una fila de la BD (snake_case) en entidad de dominio (camelCase). */
function filaAEquipo(row) {
  return new Equipo({
    id: row.id,
    nombre: row.nombre,
    modelo: row.modelo,
    fabricante: row.fabricante,
    categoria: row.categoria,
    areaId: row.area_id,
    areaNombre: row.area_nombre ?? null,
    descripcion: row.descripcion,
    imagenUrl: row.imagen_url,
    imagenClave: row.imagen_clave,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

// SELECT base con el nombre del área adjunto.
const SELECT_BASE = `
  SELECT e.*, a.nombre AS area_nombre
    FROM equipos e
    LEFT JOIN areas a ON a.id = e.area_id`;

export class MySqlEquipoRepository extends IEquipoRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listar() {
    const [rows] = await this.pool.query(`${SELECT_BASE} ORDER BY e.nombre ASC`);
    return rows.map(filaAEquipo);
  }

  async obtenerPorId(id) {
    const [rows] = await this.pool.query(`${SELECT_BASE} WHERE e.id = ?`, [id]);
    return rows.length ? filaAEquipo(rows[0]) : null;
  }

  async crear(equipo) {
    const [result] = await this.pool.query(
      `INSERT INTO equipos (nombre, modelo, fabricante, categoria, area_id, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        equipo.nombre,
        equipo.modelo,
        equipo.fabricante,
        equipo.categoria,
        equipo.areaId,
        equipo.descripcion,
      ],
    );
    return this.obtenerPorId(result.insertId);
  }

  async actualizar(id, datos) {
    await this.pool.query(
      `UPDATE equipos
          SET nombre = ?, modelo = ?, fabricante = ?, categoria = ?, area_id = ?, descripcion = ?
        WHERE id = ?`,
      [
        datos.nombre,
        datos.modelo ?? null,
        datos.fabricante ?? null,
        datos.categoria ?? null,
        datos.areaId ?? null,
        datos.descripcion ?? null,
        id,
      ],
    );
    return this.obtenerPorId(id);
  }

  /** Actualiza solo la clave de la imagen del equipo. */
  async actualizarImagen(id, imagenClave) {
    await this.pool.query('UPDATE equipos SET imagen_clave = ? WHERE id = ?', [imagenClave, id]);
    return this.obtenerPorId(id);
  }

  async eliminar(id) {
    // ON DELETE CASCADE borra automáticamente los documentos asociados.
    await this.pool.query('DELETE FROM equipos WHERE id = ?', [id]);
  }
}
