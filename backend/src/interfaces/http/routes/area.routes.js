import { Router } from 'express';
import { areaController } from '../controllers/area.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function areaRoutes(deps) {
  const router = Router();
  const areas = areaController(deps);
  const { authenticate, authorize } = deps.auth;

  // Lectura: cualquier usuario autenticado (para el desplegable de equipos).
  router.get('/', authenticate, asyncHandler(areas.listar));

  // Gestión: solo admin.
  router.post('/', authenticate, authorize('admin'), asyncHandler(areas.crear));
  router.put('/:id', authenticate, authorize('admin'), asyncHandler(areas.actualizar));
  router.delete('/:id', authenticate, authorize('admin'), asyncHandler(areas.eliminar));

  return router;
}
