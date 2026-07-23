// Adaptador de embeddings de Google Gemini.
//
// Usa el endpoint embedContent (uno por texto), porque el modelo
// gemini-embedding-001 no expone batchEmbedContents en esta API.
//
// Resiliencia al rate limit del free tier: ante 429/503 reintenta con espera
// (backoff exponencial, respetando el retryDelay que sugiere Gemini). Así un
// PDF grande se indexa aunque tarde más, en vez de quedar en "error".
//
// outputDimensionality fija la dimensión del vector (debe coincidir con la
// colección de Qdrant). Con Cosine en Qdrant la normalización es interna.

import { IEmbeddingProvider } from '../../domain/services/IEmbeddingProvider.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CONCURRENCIA = 2;      // llamadas simultáneas (suave con el rate limit)
const MAX_REINTENTOS = 6;
const ESPERA_BASE_MS = 2000;

const TASK_TYPE = { documento: 'RETRIEVAL_DOCUMENT', consulta: 'RETRIEVAL_QUERY' };

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Extrae el retryDelay (p. ej. "37s") del cuerpo de error de Gemini, en ms. */
function retryDelayMs(detalle) {
  try {
    const data = JSON.parse(detalle);
    const det = data?.error?.details?.find((d) => d.retryDelay)?.retryDelay;
    if (det) {
      const seg = Number(String(det).replace('s', ''));
      if (!Number.isNaN(seg)) return seg * 1000;
    }
  } catch {
    /* cuerpo no-JSON: usamos backoff exponencial */
  }
  return null;
}

/** true si el 429 es por la cuota DIARIA (no se resuelve reintentando hoy). */
function esCuotaDiaria(detalle) {
  return /PerDay|RequestsPerDay|_free_tier_requests/i.test(detalle);
}

export class GeminiEmbeddingProvider extends IEmbeddingProvider {
  constructor({ apiKey, model, dim }) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.dim = dim;
  }

  async _embeberUno(texto, taskType, intento = 0) {
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

    if (res.ok) {
      const data = await res.json();
      return data?.embedding?.values ?? [];
    }

    const detalle = await res.text();

    // Cuota DIARIA agotada: reintentar hoy no sirve → fallar rápido y claro.
    if (res.status === 429 && esCuotaDiaria(detalle)) {
      throw new Error(
        'Cuota diaria de embeddings del free tier de Gemini agotada (1000/día). ' +
          'Se restablece mañana. Para más volumen: habilita facturación en Google AI Studio ' +
          'o usa otro proveedor de embeddings (p. ej. Ollama local).',
      );
    }

    // 429 por minuto (RPM) o 503 (sobrecarga): esperar y reintentar.
    if ((res.status === 429 || res.status === 503) && intento < MAX_REINTENTOS) {
      const sugerido = retryDelayMs(detalle);
      const espera = sugerido ?? ESPERA_BASE_MS * 2 ** intento; // 2s,4s,8s,16s…
      await dormir(espera);
      return this._embeberUno(texto, taskType, intento + 1);
    }

    throw new Error(`Gemini embeddings falló (${res.status}): ${detalle.slice(0, 200)}`);
  }

  async embeber(textos, { tipo = 'documento' } = {}) {
    if (!this.apiKey) {
      throw new Error('Falta GEMINI_API_KEY: configura tu clave de Google AI Studio en .env');
    }
    const taskType = TASK_TYPE[tipo] || 'RETRIEVAL_DOCUMENT';
    const vectores = new Array(textos.length);

    // Procesar con concurrencia limitada, conservando el orden.
    for (let i = 0; i < textos.length; i += CONCURRENCIA) {
      const lote = textos.slice(i, i + CONCURRENCIA);
      const resultados = await Promise.all(lote.map((t) => this._embeberUno(t, taskType)));
      resultados.forEach((vec, j) => {
        vectores[i + j] = vec;
      });
    }

    return vectores;
  }
}
