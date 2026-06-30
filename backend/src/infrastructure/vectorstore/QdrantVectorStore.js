// Implementación de IVectorStore sobre Qdrant (API REST).
// Cada punto guarda en su payload: equipoId, documentoId, documentoTitulo,
// pagina, indiceChunk y el texto del chunk (para construir la respuesta y citar).

import { IVectorStore } from '../../domain/repositories/IVectorStore.js';

export class QdrantVectorStore extends IVectorStore {
  constructor({ url, collection, dim }) {
    super();
    this.url = url.replace(/\/$/, '');
    this.collection = collection;
    this.dim = dim;
  }

  async _req(metodo, ruta, body) {
    const res = await fetch(`${this.url}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok && res.status !== 404) {
      const detalle = await res.text();
      throw new Error(`Qdrant ${metodo} ${ruta} (${res.status}): ${detalle.slice(0, 300)}`);
    }
    return res;
  }

  async asegurarColeccion() {
    const existe = await this._req('GET', `/collections/${this.collection}`);
    if (existe.status === 404) {
      await this._req('PUT', `/collections/${this.collection}`, {
        vectors: { size: this.dim, distance: 'Cosine' },
      });
      // Índice sobre equipoId para filtrar rápido por equipo.
      await this._req('PUT', `/collections/${this.collection}/index`, {
        field_name: 'equipoId',
        field_schema: 'integer',
      });
      console.log(`[BioMed] Colección Qdrant '${this.collection}' creada (dim=${this.dim}).`);
    }
  }

  async upsert(puntos) {
    if (!puntos.length) return;
    await this._req('PUT', `/collections/${this.collection}/points?wait=true`, { points: puntos });
  }

  async buscar(vector, { equipoId, topK = 5 }) {
    const res = await this._req('POST', `/collections/${this.collection}/points/search`, {
      vector,
      limit: topK,
      with_payload: true,
      filter: { must: [{ key: 'equipoId', match: { value: equipoId } }] },
    });
    const data = await res.json();
    return (data.result || []).map((r) => ({ score: r.score, payload: r.payload }));
  }

  async eliminarPorDocumento(documentoId) {
    await this._req('POST', `/collections/${this.collection}/points/delete?wait=true`, {
      filter: { must: [{ key: 'documentoId', match: { value: documentoId } }] },
    });
  }
}
