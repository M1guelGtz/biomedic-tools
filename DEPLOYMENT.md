# Manual de despliegue — BioMed Tools

Guía para desplegar la plataforma. Cubre el escenario **local / un solo servidor
(VPS)** con Docker Compose y deja notas para una migración a la nube.

---

## 1. Requisitos del servidor

- **Docker** y **Docker Compose** (Docker Engine 24+).
- 2 vCPU / 4 GB RAM como mínimo (MySQL + Qdrant + backend + frontend).
- Puertos abiertos según necesidad (por defecto 8090 frontend, 4000 API).
- Una **API key** de IA (Gemini gratis, u otro proveedor compatible).

> En Windows/Mac sirve Docker Desktop. En un VPS Linux instala Docker Engine.

---

## 2. Despliegue paso a paso (Docker Compose)

```bash
# 1) Clonar / copiar el proyecto al servidor
git clone <repo>  # o sube los archivos
cd Biomedica

# 2) Crear el archivo de entorno y editarlo
cp .env.example .env
nano .env          # ver sección 3 (valores de producción)

# 3) Construir y levantar todo
docker compose up -d --build

# 4) Verificar
docker compose ps
curl http://localhost:4000/api/health/ready    # {"status":"ok","database":"up"}
```

Accede al frontend en `http://<IP-del-servidor>:8090`.
El usuario admin se crea solo al arrancar (credenciales de `.env`).

---

## 3. Configuración para PRODUCCIÓN (`.env`)

Cambia **obligatoriamente** estos valores antes de exponer el sistema:

| Variable | Valor de producción |
|----------|---------------------|
| `NODE_ENV` | `production` (oculta los stack traces en los errores) |
| `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` | contraseñas fuertes y únicas |
| `JWT_SECRET` | secreto aleatorio largo (`openssl rand -hex 32`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | credenciales reales del admin |
| `GEMINI_API_KEY` (o proveedor elegido) | tu clave real |
| `CORS_ORIGIN` | el dominio real del frontend (no `*`) |
| `VITE_API_URL` | URL pública de la API (p. ej. `https://api.tudominio.com/api`) |

> `VITE_API_URL` se inyecta al **construir** el frontend. Si lo cambias, reconstruye:
> `docker compose up -d --build frontend`.

Añade `NODE_ENV=production` al `.env` (el `docker-compose` ya lo pasa al backend).

---

## 4. HTTPS y dominio (recomendado)

No expongas los puertos directamente. Pon un **reverse proxy** delante con TLS:

- **Caddy** (la opción más simple, certificados automáticos):

```caddyfile
app.tudominio.com {
    reverse_proxy localhost:8090
}
api.tudominio.com {
    reverse_proxy localhost:4000
}
```

- O **Nginx + Certbot** (Let's Encrypt) si ya usas Nginx.

Con esto el tráfico va por HTTPS y solo el proxy queda público.

---

## 5. Almacenamiento de PDFs

- **Por defecto**: disco local, carpeta `./storage` (volumen montado en el backend).
  Asegúrate de **incluirla en los backups**.
- **Producción a escala / varios servidores**: cambia a almacenamiento de objetos.
  La arquitectura ya está preparada (interfaz `IFileStorage`): crea una clase
  `S3FileStorage` / `MinioFileStorage` que cumpla ese contrato e inyéctala en
  `src/main.js`. Variables sugeridas: `STORAGE_DRIVER=s3`, credenciales del bucket.

---

## 6. Backups

Programa (p. ej. con `cron`) copias de:

```bash
# Base de datos
docker compose exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" biomed > backup_$(date +%F).sql

# Archivos PDF (storage local)
tar czf storage_$(date +%F).tar.gz ./storage

# Vectores Qdrant (volumen)
docker run --rm -v biomedica_qdrant_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/qdrant_$(date +%F).tar.gz /data
```

> Qdrant se puede **reconstruir** reindexando los documentos (botón *Reindexar*),
> así que el backup crítico es **MySQL + storage**.

---

## 7. Actualizar la aplicación

```bash
git pull                       # traer cambios
docker compose up -d --build   # reconstruir e iniciar
docker compose logs -f backend # verificar
```

Los volúmenes (`mysql_data`, `qdrant_data`) **persisten** entre actualizaciones.

---

## 8. Operación diaria

```bash
docker compose ps                 # estado de los servicios
docker compose logs -f backend    # logs del backend
docker compose restart backend    # reiniciar un servicio
docker compose down               # apagar (los datos persisten)
docker compose down -v            # apagar y BORRAR datos (¡cuidado!)
```

---

## 9. Migración a la nube (cuando se decida el hosting)

El mismo `docker-compose` corre en cualquier VPS (Hetzner, DigitalOcean, AWS Lightsail…).
Para un despliegue gestionado:

- **Base de datos**: usa un MySQL gestionado (RDS, Cloud SQL) y apunta `MYSQL_HOST`.
- **Qdrant**: Qdrant Cloud, o mantenlo en contenedor.
- **Storage**: S3 / Cloudflare R2 (ver sección 5).
- **Frontend**: se puede servir como estáticos en cualquier CDN/hosting; recuerda
  fijar `VITE_API_URL` al construir.

---

## 10. Solución de problemas

| Síntoma | Causa probable / solución |
|---------|---------------------------|
| `database: down` en `/health/ready` | MySQL aún arrancando o credenciales mal. `docker compose logs mysql`. |
| Puerto en uso al levantar | Otro servicio usa ese puerto. Cambia `*_PORT` en `.env`. |
| Asistente da **429** | Cuota del proveedor de IA agotada. Cambia `AI_CHAT_MODEL` (p. ej. `gemini-2.5-flash`) o espera. |
| Documento queda en `error` | PDF escaneado (sin texto) o falta `GEMINI_API_KEY`. Revisa logs y usa *Reindexar*. |
| El frontend no llama a la API | `VITE_API_URL` mal configurada; reconstruye el frontend. |
