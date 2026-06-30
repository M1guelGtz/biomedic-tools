// Errores de aplicación con código HTTP asociado. El middleware de errores los
// traduce a respuestas JSON uniformes. Mantiene los casos de uso desacoplados
// de Express (no conocen req/res).

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos') {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permiso para esta acción') {
    super(message, 403);
  }
}
