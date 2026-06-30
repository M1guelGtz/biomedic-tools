import { Router } from 'express';
import { asistenteController } from '../controllers/asistente.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function asistenteRoutes(deps) {
  const router = Router();
  const asistente = asistenteController(deps);
  const { authenticate } = deps.auth;

  // Consultar al asistente: cualquier usuario autenticado (admin o técnico).
  router.post('/consultar', authenticate, asyncHandler(asistente.consultar));

  // Versión en streaming (sin asyncHandler: gestiona errores internamente).
  router.post('/consultar/stream', authenticate, asistente.consultarStream);

  // Plan de mantenimiento preventivo y sugerencias de seguimiento.
  router.post('/plan', authenticate, asyncHandler(asistente.plan));
  router.post('/sugerencias', authenticate, asyncHandler(asistente.sugerencias));

  // Historial de consultas del usuario.
  router.get('/historial', authenticate, asyncHandler(asistente.historial));

  return router;
}
