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
    descripcion: row.descripcion,
    imagenUrl: row.imagen_url,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

export class MySqlEquipoRepository extends IEquipoRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listar() {
    const [rows] = await this.pool.query(
      'SELECT * FROM equipos ORDER BY nombre ASC',
    );
    return rows.map(filaAEquipo);
  }

  async obtenerPorId(id) {
    const [rows] = await this.pool.query('SELECT * FROM equipos WHERE id = ?', [id]);
    return rows.length ? filaAEquipo(rows[0]) : null;
  }

  async crear(equipo) {
    const [result] = await this.pool.query(
      `INSERT INTO equipos (nombre, modelo, fabricante, categoria, descripcion, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        equipo.nombre,
        equipo.modelo,
        equipo.fabricante,
        equipo.categoria,
        equipo.descripcion,
        equipo.imagenUrl,
      ],
    );
    return this.obtenerPorId(result.insertId);
  }

  async actualizar(id, datos) {
    await this.pool.query(
      `UPDATE equipos
          SET nombre = ?, modelo = ?, fabricante = ?, categoria = ?, descripcion = ?, imagen_url = ?
        WHERE id = ?`,
      [
        datos.nombre,
        datos.modelo ?? null,
        datos.fabricante ?? null,
        datos.categoria ?? null,
        datos.descripcion ?? null,
        datos.imagenUrl ?? null,
        id,
      ],
    );
    return this.obtenerPorId(id);
  }

  async eliminar(id) {
    // ON DELETE CASCADE borra automáticamente los documentos asociados.
    await this.pool.query('DELETE FROM equipos WHERE id = ?', [id]);
  }
}
