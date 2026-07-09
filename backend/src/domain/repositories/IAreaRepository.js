// Puerto (interfaz) del repositorio de Áreas. Implementación: MySQL.

/* eslint-disable no-unused-vars */
export class IAreaRepository {
  async listar() {
    throw new Error('No implementado: listar()');
  }

  async obtenerPorId(id) {
    throw new Error('No implementado: obtenerPorId()');
  }

  async crear(area) {
    throw new Error('No implementado: crear()');
  }

  async actualizar(id, datos) {
    throw new Error('No implementado: actualizar()');
  }

  async eliminar(id) {
    throw new Error('No implementado: eliminar()');
  }
}
