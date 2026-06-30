// Middleware central de manejo de errores. Mantiene los controladores limpios:
// cualquier error que se lance termina aquí con una respuesta JSON uniforme.

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const payload = { error: err.message || 'Error interno del servidor' };

  // En desarrollo añadimos el stack para depurar más fácil.
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  // Log básico en servidor (en producción se reemplaza por un logger estructurado).
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.message);

  res.status(status).json(payload);
}
