import { Router } from 'express';
import { equipoController } from '../controllers/equipo.controller.js';
import { documentoController } from '../controllers/documento.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { manejarUpload, manejarImagen } from '../middlewares/upload.js';

export function equipoRoutes(deps) {
  const router = Router();
  const equipos = equipoController(deps);
  const documentos = documentoController(deps);
  const { authenticate, authorize } = deps.auth;

  // Imagen del equipo: pública (se usa en <img src>), va antes que /:id.
  router.get('/:id/imagen', asyncHandler(equipos.servirImagen));

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
  // Subir/reemplazar la imagen del equipo (solo admin).
  router.post(
    '/:id/imagen',
    authenticate,
    authorize('admin'),
    manejarImagen,
    asyncHandler(equipos.subirImagen),
  );

  return router;
}
