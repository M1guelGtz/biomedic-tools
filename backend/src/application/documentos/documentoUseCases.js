// Casos de uso de Documentos (capa de aplicación).
// Orquesta tres puertos: repositorio de documentos, repositorio de equipos
// (para validar que el equipo existe) y el almacenamiento de archivos.
// No conoce MySQL ni el sistema de archivos: solo las interfaces.

import { createHash, randomUUID } from 'node:crypto';
import { Documento } from '../../domain/entities/Documento.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';

const TIPOS_VALIDOS = ['manual', 'datasheet', 'normativa', 'otro'];

export function createDocumentoUseCases({ documentoRepo, equipoRepo, fileStorage, ragService }) {
  async function asegurarEquipo(equipoId) {
    const equipo = await equipoRepo.obtenerPorId(equipoId);
    if (!equipo) throw new NotFoundError('Equipo no encontrado');
    return equipo;
  }

  async function obtenerDocumento(id) {
    const doc = await documentoRepo.obtenerPorId(id);
    if (!doc) throw new NotFoundError('Documento no encontrado');
    return doc;
  }

  return {
    listarPorEquipo: async (equipoId) => {
      await asegurarEquipo(equipoId);
      return documentoRepo.listarPorEquipo(equipoId);
    },

    /**
     * Lista documentos con paginación, opcionalmente por tipo(s) y búsqueda.
     * @param {{ tipos?: string[], q?: string, page?: number, pageSize?: number }} opts
     * @returns {Promise<{ items, total, page, pageSize }>}
     */
    listarTodos: async ({ tipos = [], q = '', page = 1, pageSize = 10 } = {}) => {
      const invalidos = tipos.filter((t) => !TIPOS_VALIDOS.includes(t));
      if (invalidos.length) {
        throw new ValidationError(`Tipo(s) inválido(s): ${invalidos.join(', ')}`);
      }
      const pag = Math.max(1, Number(page) || 1);
      const tam = Math.min(100, Math.max(1, Number(pageSize) || 10));
      const offset = (pag - 1) * tam;

      const { items, total } = await documentoRepo.listarTodos({
        tipos,
        q: q.trim(),
        limit: tam,
        offset,
      });
      return { items, total, page: pag, pageSize: tam };
    },

    obtener: (id) => obtenerDocumento(id),

    /**
     * Sube un PDF: guarda el binario en el storage y los metadatos en MySQL.
     * @param {number} equipoId
     * @param {{ buffer: Buffer, originalname: string, mimetype: string, size: number }} archivo
     * @param {{ titulo?: string, tipo?: string }} meta
     */
    subir: async (equipoId, archivo, meta = {}) => {
      await asegurarEquipo(equipoId);

      if (!archivo || !archivo.buffer) {
        throw new ValidationError('No se recibió ningún archivo');
      }
      if (archivo.mimetype !== 'application/pdf') {
        throw new ValidationError('Solo se permiten archivos PDF');
      }

      const tipo = meta.tipo ?? 'manual';
      if (!TIPOS_VALIDOS.includes(tipo)) {
        throw new ValidationError(`Tipo inválido. Use uno de: ${TIPOS_VALIDOS.join(', ')}`);
      }

      const hash = createHash('sha256').update(archivo.buffer).digest('hex');
      const clave = `${equipoId}/${randomUUID()}.pdf`;

      // 1) Guardar el binario en el storage.
      await fileStorage.guardar(archivo.buffer, { clave, mimeType: archivo.mimetype });

      // 2) Guardar los metadatos. Si falla (p.ej. duplicado), limpiar el binario.
      try {
        const documento = new Documento({
          equipoId,
          titulo: (meta.titulo && meta.titulo.trim()) || archivo.originalname.replace(/\.pdf$/i, ''),
          tipo,
          archivoClave: clave,
          nombreOriginal: archivo.originalname,
          mimeType: archivo.mimetype,
          tamanoBytes: archivo.size,
          hashSha256: hash,
          estadoIndexado: 'pendiente', // se indexa para el RAG a continuación
        });
        const creado = await documentoRepo.crear(documento);

        // Indexado RAG en segundo plano (no bloquea la respuesta de subida).
        if (ragService) {
          ragService.indexar(creado).catch((e) =>
            console.error('[RAG] Fallo al lanzar indexado:', e.message),
          );
        }
        return creado;
      } catch (err) {
        await fileStorage.eliminar(clave).catch(() => {});
        if (err.code === 'ER_DUP_ENTRY') {
          throw new ConflictError('Este documento ya existe para el equipo (mismo contenido)');
        }
        throw err;
      }
    },

    /** Devuelve metadatos + binario para descargar/visualizar. */
    descargar: async (id) => {
      const documento = await obtenerDocumento(id);
      const buffer = await fileStorage.leer(documento.archivoClave);
      return { documento, buffer };
    },

    eliminar: async (id) => {
      const documento = await obtenerDocumento(id);
      // Borrar primero los vectores del RAG (MySQL borra los chunks por cascada).
      if (ragService) await ragService.eliminarIndice(id).catch(() => {});
      await fileStorage.eliminar(documento.archivoClave).catch(() => {});
      await documentoRepo.eliminar(id);
    },

    /** Reindexa un documento (admin): borra el índice y vuelve a procesar. */
    reindexar: async (id) => {
      const documento = await obtenerDocumento(id);
      if (ragService) {
        await ragService.reindexar(id);
        ragService.indexar(documento).catch((e) =>
          console.error('[RAG] Fallo al reindexar:', e.message),
        );
      }
      return documento;
    },
  };
}
