// Puerto (interfaz) del repositorio de Usuarios. Implementación: MySQL.

/* eslint-disable no-unused-vars */
export class IUsuarioRepository {
  /** @returns {Promise<import('../entities/Usuario.js').Usuario|null>} */
  async obtenerPorEmail(email) {
    throw new Error('No implementado: obtenerPorEmail()');
  }

  /** @returns {Promise<import('../entities/Usuario.js').Usuario|null>} */
  async obtenerPorId(id) {
    throw new Error('No implementado: obtenerPorId()');
  }

  /** @returns {Promise<import('../entities/Usuario.js').Usuario[]>} */
  async listar() {
    throw new Error('No implementado: listar()');
  }

  /** @returns {Promise<import('../entities/Usuario.js').Usuario>} */
  async crear(usuario) {
    throw new Error('No implementado: crear()');
  }

  /** @returns {Promise<number>} cantidad de usuarios con un rol dado */
  async contarPorRol(rol) {
    throw new Error('No implementado: contarPorRol()');
  }
}
