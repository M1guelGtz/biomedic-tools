import { IAreaRepository } from '../../domain/repositories/IAreaRepository.js';
import { Area } from '../../domain/entities/Area.js';

function filaAArea(row) {
  return new Area({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

export class MySqlAreaRepository extends IAreaRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listar() {
    // Incluye el nº de equipos por área (útil para la UI).
    const [rows] = await this.pool.query(
      `SELECT a.*, COUNT(e.id) AS total_equipos
         FROM areas a
         LEFT JOIN equipos e ON e.area_id = a.id
        GROUP BY a.id
        ORDER BY a.nombre ASC`,
    );
    return rows.map((r) => ({ ...filaAArea(r), totalEquipos: Number(r.total_equipos) }));
  }

  async obtenerPorId(id) {
    const [rows] = await this.pool.query('SELECT * FROM areas WHERE id = ?', [id]);
    return rows.length ? filaAArea(rows[0]) : null;
  }

  async crear(area) {
    const [result] = await this.pool.query(
      'INSERT INTO areas (nombre, descripcion) VALUES (?, ?)',
      [area.nombre, area.descripcion],
    );
    return this.obtenerPorId(result.insertId);
  }

  async actualizar(id, datos) {
    await this.pool.query('UPDATE areas SET nombre = ?, descripcion = ? WHERE id = ?', [
      datos.nombre,
      datos.descripcion ?? null,
      id,
    ]);
    return this.obtenerPorId(id);
  }

  async eliminar(id) {
    // ON DELETE SET NULL: los equipos del área quedan sin área, no se borran.
    await this.pool.query('DELETE FROM areas WHERE id = ?', [id]);
  }
}
