// Pool de conexiones MySQL (singleton).
// La capa de infraestructura es la ÚNICA que conoce mysql2; el resto del
// código depende de interfaces (puertos), nunca del driver directamente.

import mysql from 'mysql2/promise';
import { config } from '../../config/env.js';

let pool;

/** Devuelve el pool de conexiones, creándolo la primera vez. */
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4_unicode_ci',
      timezone: 'Z',
    });
  }
  return pool;
}

/** Comprueba que la base de datos responde (usado por el health check). */
export async function pingDatabase() {
  const connection = await getPool().getConnection();
  try {
    await connection.query('SELECT 1');
    return true;
  } finally {
    connection.release();
  }
}

/** Cierra el pool de forma ordenada (apagado del proceso). */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
