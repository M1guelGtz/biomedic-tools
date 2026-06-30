// Puerto (interfaz) del repositorio de Equipos.
// Define el CONTRATO que la capa de aplicación usa; la implementación concreta
// (MySQL) vive en infrastructure. Esto permite testear con un repositorio falso
// y cambiar de base de datos sin tocar los casos de uso.  -> Patrón Repository.

/* eslint-disable no-unused-vars */
export class IEquipoRepository {
  /** @returns {Promise<import('../entities/Equipo.js').Equipo[]>} */
  async listar() {
    throw new Error('No implementado: listar()');
  }

  /** @returns {Promise<import('../entities/Equipo.js').Equipo|null>} */
  async obtenerPorId(id) {
    throw new Error('No implementado: obtenerPorId()');
  }

  /** @returns {Promise<import('../entities/Equipo.js').Equipo>} */
  async crear(equipo) {
    throw new Error('No implementado: crear()');
  }

  /** @returns {Promise<import('../entities/Equipo.js').Equipo>} */
  async actualizar(id, datos) {
    throw new Error('No implementado: actualizar()');
  }

  /** @returns {Promise<void>} */
  async eliminar(id) {
    throw new Error('No implementado: eliminar()');
  }
}
