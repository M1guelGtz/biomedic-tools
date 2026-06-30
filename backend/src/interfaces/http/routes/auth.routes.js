import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function authRoutes(deps) {
  const router = Router();
  const auth = authController(deps);
  const { authenticate, authorize } = deps.auth;

  // Público.
  router.post('/login', asyncHandler(auth.login));

  // Requiere sesión.
  router.get('/me', authenticate, asyncHandler(auth.me));

  // Gestión de usuarios: solo admin.
  router.get('/usuarios', authenticate, authorize('admin'), asyncHandler(auth.listarUsuarios));
  router.post('/usuarios', authenticate, authorize('admin'), asyncHandler(auth.crearUsuario));

  return router;
}
