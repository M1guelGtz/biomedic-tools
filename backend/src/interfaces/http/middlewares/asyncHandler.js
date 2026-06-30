// Envuelve un controlador async para que cualquier error pase al errorHandler
// central sin tener que escribir try/catch en cada controlador.

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
