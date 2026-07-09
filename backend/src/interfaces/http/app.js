// Construye la aplicación Express y monta las rutas.
// Recibe las dependencias ya resueltas (inyección desde el composition root),
// de modo que aquí no se instancian repositorios ni servicios directamente.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from '../../config/env.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { equipoRoutes } from './routes/equipo.routes.js';
import { areaRoutes } from './routes/area.routes.js';
import { documentoRoutes } from './routes/documento.routes.js';
import { asistenteRoutes } from './routes/asistente.routes.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

export function createApp(deps = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  // --- Rutas de la API ---
  app.use('/api/health', healthRoutes());
  app.use('/api/auth', authRoutes(deps));
  app.use('/api/equipos', equipoRoutes(deps));
  app.use('/api/areas', areaRoutes(deps));
  app.use('/api/documentos', documentoRoutes(deps));
  app.use('/api/asistente', asistenteRoutes(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
