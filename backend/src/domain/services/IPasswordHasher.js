// Puerto (interfaz) para el hashing de contraseñas. -> Patrón Adapter.
// Permite cambiar bcrypt por argon2, etc., sin tocar los casos de uso.

/* eslint-disable no-unused-vars */
export class IPasswordHasher {
  /** @returns {Promise<string>} hash de la contraseña */
  async hash(plano) {
    throw new Error('No implementado: hash()');
  }

  /** @returns {Promise<boolean>} true si la contraseña coincide con el hash */
  async comparar(plano, hash) {
    throw new Error('No implementado: comparar()');
  }
}
