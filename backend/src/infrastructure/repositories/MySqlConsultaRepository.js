import { IConsultaRepository } from '../../domain/repositories/IConsultaRepository.js';

export class MySqlConsultaRepository extends IConsultaRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async registrar({ equipoId, usuarioId, pregunta, respuesta, fuentes }) {
    await this.pool.query(
      `INSERT INTO consultas_ia (equipo_id, usuario_id, pregunta, respuesta, fuentes_json)
       VALUES (?, ?, ?, ?, ?)`,
      [equipoId, usuarioId ?? null, pregunta, respuesta, JSON.stringify(fuentes ?? [])],
    );
  }

  async listarPorUsuario(usuarioId, { limit = 20, offset = 0 } = {}) {
    const [rows] = await this.pool.query(
      `SELECT c.id, c.equipo_id, c.pregunta, c.respuesta, c.fuentes_json, c.creado_en,
              e.nombre AS equipo_nombre
         FROM consultas_ia c
         LEFT JOIN equipos e ON e.id = c.equipo_id
        WHERE c.usuario_id = ?
        ORDER BY c.creado_en DESC
        LIMIT ? OFFSET ?`,
      [usuarioId, Number(limit), Number(offset)],
    );
    return rows.map((r) => ({
      id: r.id,
      equipoId: r.equipo_id,
      equipoNombre: r.equipo_nombre,
      pregunta: r.pregunta,
      respuesta: r.respuesta,
      // mysql2 puede devolver JSON ya parseado o como string; normalizamos.
      fuentes: typeof r.fuentes_json === 'string' ? JSON.parse(r.fuentes_json || '[]') : (r.fuentes_json ?? []),
      creadoEn: r.creado_en,
    }));
  }
}
