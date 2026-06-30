import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

export function healthRoutes() {
  const router = Router();
  const controller = healthController();

  router.get('/', controller.live);
  router.get('/ready', controller.ready);

  return router;
}
