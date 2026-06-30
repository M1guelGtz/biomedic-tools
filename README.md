# BioMed Tools

Plataforma para gestionar **manuales y documentación técnica de equipos médicos**, con un **asistente IA (RAG con Claude)** al que se le puede preguntar sobre mantenimiento y fallas de cada equipo.

> ⚕️ **Aviso:** el asistente es una herramienta de apoyo. La información debe verificarse siempre contra el manual oficial del fabricante y los protocolos clínicos vigentes.

## Arquitectura

```
┌────────────┐     HTTP/JSON    ┌──────────────────────────┐
│  Frontend  │ ───────────────► │  Backend (Node.js)       │
│  React+Vite│                  │  Arquitectura limpia     │
└────────────┘                  │                          │
                                │  ├─ domain (entidades)   │
                                │  ├─ application (casos)  │
                                │  ├─ infrastructure       │
                                │  └─ interfaces (HTTP)    │
                                └───────┬───────┬──────────┘
                                        │       │
                              ┌─────────▼──┐ ┌──▼──────────┐
                              │  MySQL     │ │  Qdrant     │
                              │ (metadatos)│ │ (vectores)  │
                              └────────────┘ └─────────────┘
                                        │
                                  ┌─────▼──────┐
                                  │  Storage   │  PDFs (disco / S3)
                                  └────────────┘
```

- **Los PDFs no se guardan en MySQL.** El archivo va al storage (disco/S3) y MySQL guarda solo los metadatos y la clave para localizarlo.
- **RAG:** los PDFs se trocean, se convierten en embeddings (Voyage) y se guardan en Qdrant con el `equipo_id`. El asistente busca solo en el equipo seleccionado y responde citando la fuente.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite, React Router, Axios |
| Backend | Node.js + Express (arquitectura limpia, patrones Repository/Adapter/Strategy/DI) |
| Base de datos | MySQL 8 |
| Vector store | Qdrant |
| IA | Claude (`claude-sonnet-4-6`) + embeddings Voyage |
| Orquestación | Docker Compose |

## Cómo ejecutar (desarrollo con Docker)

1. Copia las variables de entorno y edítalas:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Levanta todo:
   ```powershell
   docker compose up -d --build
   ```
3. Abre:
   - Frontend: http://localhost:8090
   - API (health): http://localhost:4000/api/health/ready

La primera pantalla muestra el **estado de conexión** backend ↔ base de datos (verificación de la Fase 1).

### Acceso (Fase 3)

Al arrancar se crea un usuario **admin** con las credenciales de `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Por defecto en desarrollo:

- **Email:** `admin@biomedtools.local`
- **Contraseña:** la que pongas en `ADMIN_PASSWORD`

El admin puede crear usuarios **técnico** (solo lectura) desde la sección **Usuarios**.
Cambia estas credenciales antes de exponer el sistema.

### Activar el Asistente IA (Fase 4)

El asistente usa **RAG**: indexa los PDF (embeddings → Qdrant) y responde con citas.
Por defecto está cableado a **Google Gemini (free tier)**. Para activarlo:

1. Crea una API key gratis en <https://aistudio.google.com/app/apikey>.
2. Pégala en `.env`:
   ```
   GEMINI_API_KEY=tu_clave_aqui
   ```
3. Reinicia el backend: `docker compose up -d backend`
4. Sube un PDF (con texto) a un equipo. El estado pasa de `pendiente` → `indexado`.
   Si ya tenías PDFs en estado `error`, pulsa **Reindexar**.
5. Ve a **Asistente IA**, elige el equipo y pregunta.

**Capacidades del asistente:**
- **Modo 🔒 Estricto** — responde solo con los manuales indexados, citando la fuente (ideal para procedimientos críticos).
- **Modo 💬 Asesor** — añade recomendaciones de buena práctica (criterio) e **información de internet** (grounding con Google Search), con las secciones 📘 manual / 🧠 recomendación / 🌐 web / ⚠️ precaución. Se desactiva con `AI_WEB_GROUNDING=false`.
- **Respuesta en streaming** (se ve escribir) e **historial** de consultas por usuario.
- **📋 Plan preventivo** — genera un checklist de mantenimiento del equipo (manual + web).
- **Chips de seguimiento** — preguntas sugeridas tras cada respuesta.

> 💡 Si el chat da error **429 (cuota)**, cambia `AI_CHAT_MODEL=gemini-2.5-flash`
> en `.env` y reinicia el backend. Las claves nuevas (formato `AQ.`) usan
> `AI_EMBEDDING_MODEL=gemini-embedding-001` (ya configurado por defecto).

¿Prefieres otro proveedor? Cambia `AI_PROVIDER` y las variables en `.env`
(soporta DeepSeek/Groq/Ollama/OpenAI vía formato compatible-OpenAI). Ver `.env.example`.

> ⚠️ DeepSeek no ofrece embeddings; si lo usas para chat, deja los embeddings
> en Gemini u Ollama.

## Ejecutar sin Docker (opcional)

Necesitas MySQL y Qdrant corriendo localmente, luego:

```powershell
# Backend
cd backend; npm install; npm run dev

# Frontend (en otra terminal)
cd frontend; npm install; npm run dev
```

## Documentación

- [`CONFIGURATION.md`](CONFIGURATION.md) — qué configurar y qué falta por hacer.
- `DEPLOYMENT.md` — manual de despliegue (se completa en la Fase 5).

## Estado del proyecto (por fases)

- [x] **Fase 1** — Estructura, `docker-compose`, modelo de datos y conectividad.
- [x] **Fase 2** — CRUD de equipos y documentos + subida/listado/descarga de PDFs.
- [x] **Fase 3** — Autenticación con roles (admin / técnico), JWT y rutas protegidas.
- [x] **Fase 4** — Pipeline RAG (Gemini + Qdrant) + asistente IA con citas.
- [x] **Fase 5** — Frontend completo (landing, Manuales, Normativas, Acerca de) + manual de despliegue.

Ver el manual de despliegue en [`DEPLOYMENT.md`](DEPLOYMENT.md).
