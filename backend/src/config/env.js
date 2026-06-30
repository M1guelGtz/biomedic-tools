// Carga y valida las variables de entorno en un solo lugar.
// Si falta algo crítico, el proceso falla rápido con un mensaje claro.

import dotenv from 'dotenv';

dotenv.config();

/** Lee una variable obligatoria; lanza error si no existe. */
function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

/** Lee una variable opcional con valor por defecto. */
function optional(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export const config = Object.freeze({
  env: optional('NODE_ENV', 'development'),
  port: Number(optional('BACKEND_PORT', '4000')),

  mysql: {
    host: optional('MYSQL_HOST', 'localhost'),
    port: Number(optional('MYSQL_PORT', '3306')),
    user: required('MYSQL_USER'),
    password: required('MYSQL_PASSWORD'),
    database: required('MYSQL_DATABASE'),
  },

  storage: {
    // 'local' (disco) por ahora; 'gcs'/'s3' se añaden en infraestructura sin tocar casos de uso.
    driver: optional('STORAGE_DRIVER', 'local'),
    localPath: optional('STORAGE_LOCAL_PATH', './storage'),
  },

  qdrant: {
    url: optional('QDRANT_URL', 'http://localhost:6333'),
  },

  // Configuración de IA (Fase 4). Provider-agnóstica: se elige por AI_PROVIDER.
  //   'gemini' -> Google Gemini (free tier)
  //   'openai' -> cualquier API compatible con OpenAI (DeepSeek, Groq, Ollama, OpenAI)
  ai: {
    provider: optional('AI_PROVIDER', 'gemini'),
    chatModel: optional('AI_CHAT_MODEL', 'gemini-2.0-flash'),
    embeddingModel: optional('AI_EMBEDDING_MODEL', 'text-embedding-004'),
    // Dimensión del vector de embeddings (text-embedding-004 = 768).
    embeddingDim: Number(optional('AI_EMBEDDING_DIM', '768')),
    // Grounding web (Google Search) en modo Asesor. Solo lo soporta Gemini.
    webGrounding: optional('AI_WEB_GROUNDING', 'true') === 'true',

    gemini: {
      apiKey: optional('GEMINI_API_KEY', ''),
    },
    // Para proveedores compatibles con OpenAI.
    openai: {
      baseUrl: optional('AI_BASE_URL', ''),
      apiKey: optional('AI_API_KEY', ''),
    },
  },

  // Parámetros del pipeline RAG.
  rag: {
    collection: optional('RAG_COLLECTION', 'biomed_docs'),
    chunkSize: Number(optional('RAG_CHUNK_SIZE', '1000')),
    chunkOverlap: Number(optional('RAG_CHUNK_OVERLAP', '150')),
    topK: Number(optional('RAG_TOP_K', '5')),
  },

  auth: {
    jwtSecret: optional('JWT_SECRET', 'cambia-esto-en-produccion'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '8h'),
  },

  // Admin inicial: se crea al arrancar si no existe ningún admin.
  admin: {
    nombre: optional('ADMIN_NOMBRE', 'Administrador'),
    email: optional('ADMIN_EMAIL', ''),
    password: optional('ADMIN_PASSWORD', ''),
  },

  corsOrigin: optional('CORS_ORIGIN', '*'),
});
