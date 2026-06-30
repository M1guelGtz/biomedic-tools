// Implementación de IFileStorage sobre el disco local.
// Guarda los PDFs en una carpeta base (config.storage.localPath).
// Para migrar a S3/MinIO/R2 basta con crear otra clase que cumpla el mismo
// contrato e inyectarla en el composition root, sin tocar los casos de uso.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { IFileStorage } from '../../domain/repositories/IFileStorage.js';

export class LocalFileStorage extends IFileStorage {
  constructor(basePath) {
    super();
    this.basePath = path.resolve(basePath);
  }

  /** Resuelve la ruta absoluta y evita salir de la carpeta base (path traversal). */
  _rutaSegura(clave) {
    const destino = path.resolve(this.basePath, clave);
    if (!destino.startsWith(this.basePath)) {
      throw new Error('Clave de archivo inválida');
    }
    return destino;
  }

  async guardar(buffer, { clave }) {
    const destino = this._rutaSegura(clave);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, buffer);
    return clave;
  }

  async leer(clave) {
    return fs.readFile(this._rutaSegura(clave));
  }

  async eliminar(clave) {
    await fs.unlink(this._rutaSegura(clave));
  }
}
