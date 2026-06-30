import { Router } from 'express';
import { equipoController } from '../controllers/equipo.controller.js';
import { documentoController } from '../controllers/documento.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { manejarUpload } from '../middlewares/upload.js';

export function equipoRoutes(deps) {
  const router = Router();
  const equipos = equipoController(deps);
  const documentos = documentoController(deps);
  const { authenticate, authorize } = deps.auth;

  // Lectura: cualquier usuario autenticado (admin o técnico).
  router.get('/', authenticate, asyncHandler(equipos.listar));
  router.get('/:id', authenticate, asyncHandler(equipos.obtener));
  router.get('/:id/documentos', authenticate, asyncHandler(documentos.listarPorEquipo));

  // Escritura: solo admin.
  router.post('/', authenticate, authorize('admin'), asyncHandler(equipos.crear));
  router.put('/:id', authenticate, authorize('admin'), asyncHandler(equipos.actualizar));
  router.delete('/:id', authenticate, authorize('admin'), asyncHandler(equipos.eliminar));
  router.post(
    '/:id/documentos',
    authenticate,
    authorize('admin'),
    manejarUpload,
    asyncHandler(documentos.subir),
  );

  return router;
}
