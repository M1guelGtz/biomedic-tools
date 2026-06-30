// Puerto (interfaz) del proveedor de embeddings. -> Patrón Adapter/Strategy.

/* eslint-disable no-unused-vars */
export class IEmbeddingProvider {
  /**
   * Convierte textos en vectores.
   * @param {string[]} textos
   * @param {{ tipo?: 'documento' | 'consulta' }} opts  (mejora la recuperación)
   * @returns {Promise<number[][]>} un vector por texto
   */
  async embeber(textos, opts) {
    throw new Error('No implementado: embeber()');
  }
}
