// Casos de uso de Equipos (capa de aplicación).
// Factory que recibe el repositorio por inyección (depende del PUERTO, no de
// MySQL). Cada función es un caso de uso testeable de forma aislada.

import { randomUUID } from 'node:crypto';
import { Equipo } from '../../domain/entities/Equipo.js';
import { NotFoundError, ValidationError } from '../errors.js';

// Tipos de imagen permitidos y su extensión.
const IMG_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const EXT_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

export function createEquipoUseCases({ equipoRepo, areaRepo, fileStorage }) {
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

  /** Normaliza el area_id (número o null) y valida que exista. */
  async function resolverAreaId(valor) {
    if (valor === undefined || valor === null || valor === '') return null;
    const areaId = Number(valor);
    if (Number.isNaN(areaId)) throw new ValidationError('Área inválida');
    if (areaRepo && !(await areaRepo.obtenerPorId(areaId))) {
      throw new ValidationError('El área seleccionada no existe');
    }
    return areaId;
  }

  return {
    listar: () => equipoRepo.listar(),

    obtener: (id) => obtenerExistente(id),

    crear: async (datos) => {
      validarDatos(datos);
      const areaId = await resolverAreaId(datos.areaId);
      const equipo = new Equipo({
        nombre: datos.nombre.trim(),
        modelo: datos.modelo ?? null,
        fabricante: datos.fabricante ?? null,
        categoria: datos.categoria ?? null,
        areaId,
        descripcion: datos.descripcion ?? null,
      });
      return equipoRepo.crear(equipo);
    },

    actualizar: async (id, datos) => {
      await obtenerExistente(id);
      validarDatos(datos);
      const areaId = await resolverAreaId(datos.areaId);
      return equipoRepo.actualizar(id, { ...datos, areaId });
    },

    eliminar: async (id) => {
      const equipo = await obtenerExistente(id);
      if (equipo.imagenClave) await fileStorage.eliminar(equipo.imagenClave).catch(() => {});
      await equipoRepo.eliminar(id);
    },

    /**
     * Sube/reemplaza la imagen del equipo.
     * @param {{ buffer:Buffer, mimetype:string }} archivo
     */
    subirImagen: async (id, archivo) => {
      const equipo = await obtenerExistente(id);
      if (!archivo || !archivo.buffer) throw new ValidationError('No se recibió ninguna imagen');
      const ext = IMG_EXT[archivo.mimetype];
      if (!ext) throw new ValidationError('Formato no permitido (usa PNG, JPG, WEBP o GIF)');

      const clave = `equipos/${id}/${randomUUID()}.${ext}`;
      await fileStorage.guardar(archivo.buffer, { clave, mimeType: archivo.mimetype });

      // Borrar la imagen anterior si existía.
      if (equipo.imagenClave && equipo.imagenClave !== clave) {
        await fileStorage.eliminar(equipo.imagenClave).catch(() => {});
      }
      return equipoRepo.actualizarImagen(id, clave);
    },

    /** Devuelve el binario de la imagen + su content-type. */
    obtenerImagen: async (id) => {
      const equipo = await obtenerExistente(id);
      if (!equipo.imagenClave) throw new NotFoundError('El equipo no tiene imagen');
      const buffer = await fileStorage.leer(equipo.imagenClave);
      const ext = equipo.imagenClave.split('.').pop().toLowerCase();
      return { buffer, mimeType: EXT_MIME[ext] || 'application/octet-stream' };
    },
  };
}
