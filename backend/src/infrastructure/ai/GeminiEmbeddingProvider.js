// Adaptador de embeddings de Google Gemini.
//
// Usa el endpoint embedContent (uno por texto), porque el modelo
// gemini-embedding-001 no expone batchEmbedContents en esta API.
// Procesa con concurrencia limitada para no superar los límites del free tier.
//
// outputDimensionality fija la dimensión del vector (debe coincidir con la
// colección de Qdrant). Con Cosine en Qdrant la normalización es interna.

import { IEmbeddingProvider } from '../../domain/services/IEmbeddingProvider.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CONCURRENCIA = 4;

const TASK_TYPE = { documento: 'RETRIEVAL_DOCUMENT', consulta: 'RETRIEVAL_QUERY' };

export class GeminiEmbeddingProvider extends IEmbeddingProvider {
  constructor({ apiKey, model, dim }) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.dim = dim;
  }

  async _embeberUno(texto, taskType) {
    const url = `${BASE}/models/${this.model}:embedContent?key=${this.apiKey}`;
    const body = {
      model: `models/${this.model}`,
      content: { parts: [{ text: texto }] },
      taskType,
    };
    if (this.dim) body.outputDimensionality = this.dim;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Gemini embeddings falló (${res.status}): ${detalle.slice(0, 300)}`);
    }
    const data = await res.json();
    return data?.embedding?.values ?? [];
  }

  async embeber(textos, { tipo = 'documento' } = {}) {
    if (!this.apiKey) {
      throw new Error('Falta GEMINI_API_KEY: configura tu clave de Google AI Studio en .env');
    }
    const taskType = TASK_TYPE[tipo] || 'RETRIEVAL_DOCUMENT';
    const vectores = new Array(textos.length);

    // Procesar en lotes con concurrencia limitada, conservando el orden.
    for (let i = 0; i < textos.length; i += CONCURRENCIA) {
      const lote = textos.slice(i, i + CONCURRENCIA);
      const resultados = await Promise.all(
        lote.map((t) => this._embeberUno(t, taskType)),
      );
      resultados.forEach((vec, j) => {
        vectores[i + j] = vec;
      });
    }

    return vectores;
  }
}
