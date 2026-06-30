// =====================================================================
//  Composition Root (punto de entrada).
//  Aquí se "ensamblan" las dependencias concretas y se inyectan en las
//  capas superiores. Es el ÚNICO lugar que conoce implementaciones reales.
//  -> Patrón Dependency Injection / Inversión de control.
// =====================================================================

import { config } from './config/env.js';
import { createApp } from './interfaces/http/app.js';
import { getPool, pingDatabase, closePool } from './infrastructure/database/mysqlPool.js';
import { MySqlEquipoRepository } from './infrastructure/repositories/MySqlEquipoRepository.js';
import { MySqlDocumentoRepository } from './infrastructure/repositories/MySqlDocumentoRepository.js';
import { MySqlUsuarioRepository } from './infrastructure/repositories/MySqlUsuarioRepository.js';
import { MySqlDocumentoChunkRepository } from './infrastructure/repositories/MySqlDocumentoChunkRepository.js';
import { MySqlConsultaRepository } from './infrastructure/repositories/MySqlConsultaRepository.js';
import { LocalFileStorage } from './infrastructure/storage/LocalFileStorage.js';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher.js';
import { JwtTokenService } from './infrastructure/security/JwtTokenService.js';
import { crearProveedorIA } from './infrastructure/ai/providerFactory.js';
import { QdrantVectorStore } from './infrastructure/vectorstore/QdrantVectorStore.js';
import { PdfTextExtractor } from './infrastructure/pdf/PdfTextExtractor.js';
import { createEquipoUseCases } from './application/equipos/equipoUseCases.js';
import { createDocumentoUseCases } from './application/documentos/documentoUseCases.js';
import { createAuthUseCases } from './application/auth/authUseCases.js';
import { ensureAdminUser } from './application/auth/ensureAdminUser.js';
import { createRagService } from './application/rag/ragService.js';
import { createAuthMiddleware } from './interfaces/http/middlewares/auth.js';

async function bootstrap() {
  // 1) Inicializar infraestructura.
  const pool = getPool();

  // 2) Verificar conexión a MySQL antes de aceptar tráfico (con reintentos,
  //    útil cuando MySQL aún está arrancando dentro de Docker).
  await esperarBaseDeDatos();

  // 3) Crear implementaciones concretas (infraestructura) e inyectarlas en los
  //    casos de uso (aplicación). Este es el corazón de la inversión de control.
  const equipoRepo = new MySqlEquipoRepository(pool);
  const documentoRepo = new MySqlDocumentoRepository(pool);
  const usuarioRepo = new MySqlUsuarioRepository(pool);
  const chunkRepo = new MySqlDocumentoChunkRepository(pool);
  const consultaRepo = new MySqlConsultaRepository(pool);
  const fileStorage = new LocalFileStorage(config.storage.localPath);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService({
    secret: config.auth.jwtSecret,
    expiresIn: config.auth.jwtExpiresIn,
  });

  // --- IA / RAG (Fase 4) ---
  const { chatModel, embeddingProvider } = crearProveedorIA(config.ai);
  const vectorStore = new QdrantVectorStore({
    url: config.qdrant.url,
    collection: config.rag.collection,
    dim: config.ai.embeddingDim,
  });
  const pdfExtractor = new PdfTextExtractor();
  const ragService = createRagService({
    documentoRepo,
    chunkRepo,
    consultaRepo,
    fileStorage,
    pdfExtractor,
    embeddingProvider,
    vectorStore,
    chatModel,
    ragConfig: config.rag,
    webGrounding: config.ai.webGrounding,
  });
  // Crear la colección de vectores (si Qdrant está disponible).
  await ragService.init().catch((e) =>
    console.warn('[BioMed] No se pudo inicializar Qdrant:', e.message),
  );

  const equipoUseCases = createEquipoUseCases({ equipoRepo });
  const documentoUseCases = createDocumentoUseCases({
    documentoRepo,
    equipoRepo,
    fileStorage,
    ragService,
  });
  const authUseCases = createAuthUseCases({ usuarioRepo, passwordHasher, tokenService });

  // Garantizar un admin inicial (si no existe ninguno).
  await ensureAdminUser({ usuarioRepo, passwordHasher, admin: config.admin });

  const authMiddleware = createAuthMiddleware({ tokenService });
  const deps = {
    equipoUseCases,
    documentoUseCases,
    authUseCases,
    ragService,
    auth: authMiddleware,
  };

  // 4) Construir e iniciar el servidor HTTP.
  const app = createApp(deps);
  const server = app.listen(config.port, () => {
    console.log(`[BioMed] API escuchando en http://localhost:${config.port} (${config.env})`);
  });

  // 5) Apagado ordenado.
  const shutdown = async (signal) => {
    console.log(`\n[BioMed] Recibido ${signal}, cerrando...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/** Reintenta la conexión a la BD unas cuantas veces antes de rendirse. */
async function esperarBaseDeDatos(maxIntentos = 15, esperaMs = 2000) {
  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    try {
      await pingDatabase();
      console.log('[BioMed] Conexión a MySQL establecida.');
      return;
    } catch (err) {
      console.log(`[BioMed] MySQL no disponible (intento ${intento}/${maxIntentos}): ${err.message}`);
      if (intento === maxIntentos) throw err;
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
}

bootstrap().catch((err) => {
  console.error('[BioMed] Fallo al iniciar:', err);
  process.exit(1);
});
