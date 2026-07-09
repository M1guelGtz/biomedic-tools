// Casos de uso de Áreas.

import { Area } from '../../domain/entities/Area.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';

export function createAreaUseCases({ areaRepo }) {
  async function obtenerExistente(id) {
    const area = await areaRepo.obtenerPorId(id);
    if (!area) throw new NotFoundError('Área no encontrada');
    return area;
  }

  function validar(datos) {
    if (!datos?.nombre || !datos.nombre.trim()) {
      throw new ValidationError('El nombre del área es obligatorio');
    }
  }

  /** Traduce el error de nombre duplicado (UNIQUE) a un 409 legible. */
  function traducirDuplicado(err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return new ConflictError('Ya existe un área con ese nombre');
    }
    return err;
  }

  return {
    listar: () => areaRepo.listar(),

    obtener: (id) => obtenerExistente(id),

    crear: async (datos) => {
      validar(datos);
      try {
        return await areaRepo.crear(
          new Area({ nombre: datos.nombre.trim(), descripcion: datos.descripcion ?? null }),
        );
      } catch (err) {
        throw traducirDuplicado(err);
      }
    },

    actualizar: async (id, datos) => {
      await obtenerExistente(id);
      validar(datos);
      try {
        return await areaRepo.actualizar(id, {
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion ?? null,
        });
      } catch (err) {
        throw traducirDuplicado(err);
      }
    },

    eliminar: async (id) => {
      await obtenerExistente(id);
      await areaRepo.eliminar(id);
    },
  };
}
