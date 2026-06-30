-- =====================================================================
--  BioMed Tools - Esquema de base de datos (MySQL 8.0)
--  Se ejecuta automáticamente la primera vez que arranca el contenedor.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
--  Usuarios y roles (Fase 3: autenticación)
--  rol: 'admin'   -> sube / edita / borra documentos y equipos
--       'tecnico' -> consulta el repositorio y el asistente IA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(150)    NOT NULL,
  email         VARCHAR(190)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  rol           ENUM('admin', 'tecnico') NOT NULL DEFAULT 'tecnico',
  activo        TINYINT(1)      NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Equipos médicos (núcleo del repositorio)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipos (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(200)    NOT NULL,
  modelo        VARCHAR(150)    NULL,
  fabricante    VARCHAR(150)    NULL,
  categoria     VARCHAR(120)    NULL,           -- ej: Monitoreo, Imagenología, Laboratorio
  descripcion   TEXT            NULL,
  imagen_url    VARCHAR(500)    NULL,
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_equipos_nombre (nombre),
  KEY idx_equipos_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Documentos (PDFs). El ARCHIVO vive en storage (disco / S3),
--  aquí guardamos solo los METADATOS y la "clave" para localizarlo.
--
--  tipo:           manual | datasheet | normativa | otro
--  estado_indexado: pendiente | procesando | indexado | error
--                   (controla el pipeline RAG de la Fase 4)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  equipo_id       BIGINT UNSIGNED NOT NULL,
  titulo          VARCHAR(250)    NOT NULL,
  tipo            ENUM('manual', 'datasheet', 'normativa', 'otro') NOT NULL DEFAULT 'manual',
  archivo_clave   VARCHAR(500)    NOT NULL,     -- ruta/clave en el storage (no la URL pública)
  nombre_original VARCHAR(300)    NULL,
  mime_type       VARCHAR(120)    NOT NULL DEFAULT 'application/pdf',
  tamano_bytes    BIGINT UNSIGNED NULL,
  hash_sha256     CHAR(64)        NULL,         -- para detectar duplicados
  paginas         INT UNSIGNED    NULL,
  estado_indexado ENUM('pendiente', 'procesando', 'indexado', 'error') NOT NULL DEFAULT 'pendiente',
  subido_por      BIGINT UNSIGNED NULL,
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documentos_equipo (equipo_id),
  KEY idx_documentos_tipo (tipo),
  KEY idx_documentos_estado (estado_indexado),
  UNIQUE KEY uq_documentos_hash_equipo (equipo_id, hash_sha256),
  CONSTRAINT fk_documentos_equipo
    FOREIGN KEY (equipo_id) REFERENCES equipos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_documentos_usuario
    FOREIGN KEY (subido_por) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Registro de chunks indexados (trazabilidad del RAG).
--  Los vectores reales viven en Qdrant; aquí guardamos el mapeo
--  para poder re-indexar o borrar de forma consistente (Fase 4).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documento_chunks (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  documento_id  BIGINT UNSIGNED NOT NULL,
  equipo_id     BIGINT UNSIGNED NOT NULL,
  qdrant_point_id CHAR(36)      NOT NULL,       -- UUID del punto en Qdrant
  indice_chunk  INT UNSIGNED    NOT NULL,
  pagina        INT UNSIGNED    NULL,
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chunks_documento (documento_id),
  KEY idx_chunks_equipo (equipo_id),
  CONSTRAINT fk_chunks_documento
    FOREIGN KEY (documento_id) REFERENCES documentos (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Historial de conversaciones del asistente (opcional, Fase 4).
--  Útil para auditoría en contexto médico.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultas_ia (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  equipo_id     BIGINT UNSIGNED NULL,
  usuario_id    BIGINT UNSIGNED NULL,
  pregunta      TEXT            NOT NULL,
  respuesta     MEDIUMTEXT      NULL,
  fuentes_json  JSON            NULL,           -- documentos/páginas citadas
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consultas_equipo (equipo_id),
  CONSTRAINT fk_consultas_equipo
    FOREIGN KEY (equipo_id) REFERENCES equipos (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
