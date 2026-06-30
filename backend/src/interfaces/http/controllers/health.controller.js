// Controlador de health check. Reporta el estado del servicio y de la BD.
// Los controladores son delgados: orquestan, no contienen lógica de negocio.

import { pingDatabase } from '../../../infrastructure/database/mysqlPool.js';

export function healthController() {
  return {
    // GET /api/health  -> vivo (no toca dependencias)
    async live(req, res) {
      res.json({ status: 'ok', service: 'biomed-backend' });
    },

    // GET /api/health/ready  -> listo (verifica MySQL)
    async ready(req, res) {
      try {
        await pingDatabase();
        res.json({ status: 'ok', database: 'up' });
      } catch (err) {
        res.status(503).json({ status: 'degraded', database: 'down', detail: err.message });
      }
    },
  };
}
