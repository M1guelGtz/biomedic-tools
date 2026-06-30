// Casos de uso de Equipos (capa de aplicación).
// Factory que recibe el repositorio por inyección (depende del PUERTO, no de
// MySQL). Cada función es un caso de uso testeable de forma aislada.

import { Equipo } from '../../domain/entities/Equipo.js';
import { NotFoundError, ValidationError } from '../errors.js';

export function createEquipoUseCases({ equipoRepo }) {
  /** Verifica que el equipo exista o lanza 404. */
  async function obtenerExistente(id) {
    const equipo = await equipoRepo.obtenerPorId(id);
    if (!equipo) throw new NotFoundError('Equipo no encontrado');
    return equipo;
  }

  function validarDatos(datos) {
    if (!datos?.nombre || !datos.nombre.trim()) {
      throw new ValidationError('El nombre del equipo es obligatorio');
    }
  }

  return {
    listar: () => equipoRepo.listar(),

    obtener: (id) => obtenerExistente(id),

    crear: async (datos) => {
      validarDatos(datos);
      const equipo = new Equipo({
        nombre: datos.nombre.trim(),
        modelo: datos.modelo ?? null,
        fabricante: datos.fabricante ?? null,
        categoria: datos.categoria ?? null,
        descripcion: datos.descripcion ?? null,
        imagenUrl: datos.imagenUrl ?? null,
      });
      return equipoRepo.crear(equipo);
    },

    actualizar: async (id, datos) => {
      await obtenerExistente(id);
      validarDatos(datos);
      return equipoRepo.actualizar(id, datos);
    },

    eliminar: async (id) => {
      await obtenerExistente(id);
      await equipoRepo.eliminar(id);
    },
  };
}
