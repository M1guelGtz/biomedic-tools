// Migraciones ligeras que se ejecutan al arrancar, sobre bases de datos ya
// existentes (el volumen conserva datos, así que 01_schema.sql NO se re-ejecuta).
// Son idempotentes: si el cambio ya está aplicado, se ignora sin error.

/** Ejecuta un ALTER/DDL ignorando el error de "ya existe". */
async function ignorandoDuplicado(pool, sql) {
  try {
    await pool.query(sql);
  } catch (e) {
    // Columna/índice/constraint ya existentes: no es un fallo real.
    const okDuplicado = ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_FK_DUP_NAME', 'ER_CANT_CREATE_TABLE'];
    if (okDuplicado.includes(e.code)) return;
    throw e;
  }
}

export async function migrar(pool) {
  // Tabla de áreas.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS areas (
      id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      nombre        VARCHAR(150)    NOT NULL,
      descripcion   VARCHAR(400)    NULL,
      creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_areas_nombre (nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Nuevas columnas en equipos (área e imagen).
  await ignorandoDuplicado(pool, `ALTER TABLE equipos ADD COLUMN area_id BIGINT UNSIGNED NULL AFTER categoria`);
  await ignorandoDuplicado(pool, `ALTER TABLE equipos ADD COLUMN imagen_clave VARCHAR(500) NULL AFTER imagen_url`);
  await ignorandoDuplicado(pool, `ALTER TABLE equipos ADD KEY idx_equipos_area (area_id)`);
  await ignorandoDuplicado(
    pool,
    `ALTER TABLE equipos ADD CONSTRAINT fk_equipos_area
       FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE SET NULL ON UPDATE CASCADE`,
  );

  console.log('[BioMed] Migraciones aplicadas (áreas + imagen de equipo).');
}
