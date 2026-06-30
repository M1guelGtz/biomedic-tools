# Configuración — Qué debo ajustar

Este documento lista todo lo que necesitas configurar para que la plataforma funcione, y qué queda pendiente en cada fase.

## 1. Requisitos previos

- **Docker Desktop** (incluye Docker Compose) — forma recomendada de ejecutar todo.
- *(Opcional, sin Docker)* Node.js 20+, MySQL 8 y Qdrant locales.

## 2. Archivo `.env` (obligatorio)

Copia `.env.example` a `.env` y rellena los valores. Resumen de lo importante:

| Variable | Para qué sirve | ¿Obligatoria ahora? |
|----------|----------------|---------------------|
| `MYSQL_ROOT_PASSWORD` | Clave root de MySQL | ✅ Sí |
| `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | Base de datos y usuario de la app | ✅ Sí |
| `BACKEND_PORT` / `FRONTEND_PORT` / `MYSQL_PORT` / `QDRANT_PORT` | Puertos en tu máquina | Opcional (tienen valor por defecto) |
| `STORAGE_DRIVER` / `STORAGE_LOCAL_PATH` | Dónde se guardan los PDFs | ✅ Sí (por defecto: disco local) |
| `AI_PROVIDER` | Proveedor de IA: `gemini` u `openai` | ✅ Sí (por defecto `gemini`) |
| `GEMINI_API_KEY` | Clave de Google Gemini (chat + embeddings) | ✅ Para usar el asistente |
| `AI_CHAT_MODEL` / `AI_EMBEDDING_MODEL` / `AI_EMBEDDING_DIM` | Modelos y dimensión | Opcional (valores por defecto) |
| `RAG_*` | Colección, tamaño de chunk, top-K | Opcional |
| `JWT_SECRET` | Secreto para firmar tokens de login | ✅ Sí (genera uno aleatorio) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin inicial creado al arrancar | ✅ Sí |
| `VITE_API_URL` | URL del backend que usa el frontend | ✅ Sí para producción |
| `CORS_ORIGIN` | Orígenes permitidos | Recomendado restringir en producción |

### Cómo generar secretos

```powershell
# JWT_SECRET (PowerShell)
-join ((1..32) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

## 3. Clave de IA (Fase 4)

El asistente está cableado por defecto a **Google Gemini (free tier)**, que con una
sola clave cubre **chat y embeddings**:

1. Crea una API key gratis en <https://aistudio.google.com/app/apikey>.
2. Ponla en `.env` → `GEMINI_API_KEY=...`
3. `docker compose up -d backend` para reiniciar.

**Otros proveedores** (DeepSeek/Groq/Ollama/OpenAI): pon `AI_PROVIDER=openai` y
configura `AI_BASE_URL` + `AI_API_KEY` + `AI_CHAT_MODEL`/`AI_EMBEDDING_MODEL`.
Recuerda que **DeepSeek no tiene embeddings** (usa Gemini u Ollama para esa parte).

> Estas claves son privadas y **no deben subirse a git** (`.env` ya está en `.gitignore`).

## 4. Lo que falta por configurar / decidir más adelante

| Tema | Decisión pendiente | Fase |
|------|--------------------|------|
| Almacenamiento en producción | ¿Disco del servidor, MinIO, AWS S3 o Cloudflare R2? | 2 / Despliegue |
| Hosting | Servidor donde correrá (VPS, cloud) — **aún por definir** | Despliegue |
| Backups de MySQL y del storage | Frecuencia y destino | Despliegue |
| (Opcional) Migrar a Claude/otro proveedor | Cambiar `AI_PROVIDER` y claves en `.env` | Cuando quieras |

## 5. Verificación rápida (Fase 1)

Tras `docker compose up -d --build`:

1. `http://localhost:4000/api/health` → `{ "status": "ok" }`
2. `http://localhost:4000/api/health/ready` → `{ "status": "ok", "database": "up" }`
3. `http://localhost:8090` → la tarjeta muestra **"Backend conectado · Base de datos: up"**.

Si la base de datos aparece `down`, revisa que el contenedor `biomed-mysql` esté sano (`docker compose ps`) y que las credenciales del `.env` coincidan.
