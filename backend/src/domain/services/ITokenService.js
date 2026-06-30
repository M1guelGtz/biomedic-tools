// Puerto (interfaz) para emitir/verificar tokens de sesión. -> Patrón Adapter.
// Implementación actual: JWT. Podría cambiarse por sesiones u otro esquema.

/* eslint-disable no-unused-vars */
export class ITokenService {
  /** @returns {string} token firmado */
  firmar(payload) {
    throw new Error('No implementado: firmar()');
  }

  /** @returns {object} payload verificado; lanza si es inválido/expirado */
  verificar(token) {
    throw new Error('No implementado: verificar()');
  }
}
