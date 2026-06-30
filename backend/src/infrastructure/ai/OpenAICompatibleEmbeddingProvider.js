// Adaptador de embeddings compatible con OpenAI (OpenAI, Ollama, etc.).
// Nota: DeepSeek NO ofrece embeddings; en ese caso usa Gemini u Ollama aquí.

import { IEmbeddingProvider } from '../../domain/services/IEmbeddingProvider.js';

export class OpenAICompatibleEmbeddingProvider extends IEmbeddingProvider {
  constructor({ baseUrl, apiKey, model }) {
    super();
    this.baseUrl = baseUrl?.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.model = model;
  }

  async embeber(textos) {
    if (!this.baseUrl) throw new Error('Falta AI_BASE_URL para embeddings compatible-OpenAI');

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: this.model, input: textos }),
    });
    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Embeddings falló (${res.status}): ${detalle.slice(0, 300)}`);
    }
    const data = await res.json();
    return (data.data || []).map((d) => d.embedding);
  }
}
