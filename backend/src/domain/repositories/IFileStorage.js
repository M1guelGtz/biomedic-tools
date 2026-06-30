// Puerto (interfaz) del almacenamiento de archivos.  -> Patrón Adapter/Strategy.
// La capa de aplicación guarda/lee PDFs a través de este contrato sin saber si
// detrás hay disco local, MinIO, S3 o R2. Cambiar de uno a otro = cambiar la
// implementación inyectada en el composition root, sin tocar los casos de uso.

/* eslint-disable no-unused-vars */
export class IFileStorage {
  /**
   * Guarda un archivo y devuelve la "clave" para recuperarlo después.
   * @param {Buffer} buffer
   * @param {{ clave: string, mimeType?: string }} opciones
   * @returns {Promise<string>} la clave almacenada
   */
  async guardar(buffer, opciones) {
    throw new Error('No implementado: guardar()');
  }

  /** @returns {Promise<Buffer>} contenido del archivo */
  async leer(clave) {
    throw new Error('No implementado: leer()');
  }

  /** @returns {Promise<void>} */
  async eliminar(clave) {
    throw new Error('No implementado: eliminar()');
  }
}
