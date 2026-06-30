import { Router } from 'express';
import { documentoController } from '../controllers/documento.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function documentoRoutes(deps) {
  const router = Router();
  const documentos = documentoController(deps);
  const { authenticate, authorize } = deps.auth;

  // Listado global (Manuales / Normativas), con ?tipo=. Cualquier autenticado.
  router.get('/', authenticate, asyncHandler(documentos.listarTodos));

  // Ver/descargar: cualquier usuario autenticado.
  router.get('/:id/download', authenticate, asyncHandler(documentos.descargar));

  // Eliminar / reindexar: solo admin.
  router.delete('/:id', authenticate, authorize('admin'), asyncHandler(documentos.eliminar));
  router.post('/:id/reindexar', authenticate, authorize('admin'), asyncHandler(documentos.reindexar));

  return router;
}
