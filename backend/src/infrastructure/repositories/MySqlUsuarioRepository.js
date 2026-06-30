import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';
import { Usuario } from '../../domain/entities/Usuario.js';

function filaAUsuario(row) {
  return new Usuario({
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    passwordHash: row.password_hash,
    rol: row.rol,
    activo: !!row.activo,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

export class MySqlUsuarioRepository extends IUsuarioRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async obtenerPorEmail(email) {
    const [rows] = await this.pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows.length ? filaAUsuario(rows[0]) : null;
  }

  async obtenerPorId(id) {
    const [rows] = await this.pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows.length ? filaAUsuario(rows[0]) : null;
  }

  async listar() {
    const [rows] = await this.pool.query(
      'SELECT * FROM usuarios ORDER BY creado_en DESC',
    );
    return rows.map(filaAUsuario);
  }

  async crear(usuario) {
    const [result] = await this.pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario.nombre, usuario.email, usuario.passwordHash, usuario.rol, usuario.activo ? 1 : 0],
    );
    return this.obtenerPorId(result.insertId);
  }

  async contarPorRol(rol) {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE rol = ?',
      [rol],
    );
    return Number(rows[0].total);
  }
}
