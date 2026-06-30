// Middlewares de seguridad. Se construyen con el servicio de tokens inyectado.
//   authenticate -> exige un JWT válido y adjunta req.user
//   authorize(...roles) -> exige que req.user tenga uno de los roles

import { ForbiddenError, UnauthorizedError } from '../../../application/errors.js';

export function createAuthMiddleware({ tokenService }) {
  function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) {
      next(new UnauthorizedError('Falta el token de autenticación'));
      return;
    }
    try {
      const payload = tokenService.verificar(token);
      req.user = { id: payload.sub, email: payload.email, nombre: payload.nombre, rol: payload.rol };
      next();
    } catch {
      next(new UnauthorizedError('Token inválido o expirado'));
    }
  }

  function authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        next(new UnauthorizedError());
        return;
      }
      if (roles.length && !roles.includes(req.user.rol)) {
        next(new ForbiddenError());
        return;
      }
      next();
    };
  }

  return { authenticate, authorize };
}
