// Adaptador del modelo de chat de Google Gemini (API REST, free tier).
// No usa SDK: solo fetch (disponible de forma nativa en Node 20+).
//
// Soporta "grounding" con Google Search: si se pasa { web: true }, añade la
// herramienta google_search y, al terminar, entrega las fuentes web encontradas
// por el callback onFuentesWeb (en streaming la metadata llega al final).

import { IChatModel } from '../../domain/services/IChatModel.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Extrae fuentes web del groundingMetadata, sin repetir dominio y como máximo 8. */
function fuentesWebDe(metadata, max = 8) {
  const chunks = metadata?.groundingChunks || [];
  const vistos = new Set();
  const out = [];
  for (const c of chunks) {
    const w = c?.web;
    if (!w?.uri) continue;
    const clave = (w.title || w.uri).toLowerCase(); // dedup por dominio/título
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    out.push({ titulo: w.title || w.uri, url: w.uri });
    if (out.length >= max) break;
  }
  return out;
}

export class GeminiChatModel extends IChatModel {
  constructor({ apiKey, model }) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  _cuerpo({ system, prompt, temperature, web }) {
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    // Grounding con Google Search (solo modelos Gemini 2.x).
    if (web) body.tools = [{ google_search: {} }];
    return body;
  }

  async generar({ system, prompt, temperature = 0.2, web = false, onFuentesWeb } = {}) {
    if (!this.apiKey) {
      throw new Error('Falta GEMINI_API_KEY: configura tu clave de Google AI Studio en .env');
    }

    const url = `${BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._cuerpo({ system, prompt, temperature, web })),
    });

    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Gemini chat falló (${res.status}): ${detalle.slice(0, 300)}`);
    }

    const data = await res.json();
    const cand = data?.candidates?.[0];
    const texto = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
    if (!texto) {
      const motivo = cand?.finishReason || data?.promptFeedback?.blockReason;
      throw new Error(`Gemini no devolvió texto${motivo ? ` (${motivo})` : ''}`);
    }
    if (web && onFuentesWeb) onFuentesWeb(fuentesWebDe(cand?.groundingMetadata));
    return texto.trim();
  }

  async *generarStream({ system, prompt, temperature = 0.2, web = false, onFuentesWeb } = {}) {
    if (!this.apiKey) {
      throw new Error('Falta GEMINI_API_KEY: configura tu clave de Google AI Studio en .env');
    }

    const url = `${BASE}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._cuerpo({ system, prompt, temperature, web })),
    });
    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Gemini stream falló (${res.status}): ${detalle.slice(0, 300)}`);
    }

    // Respuesta SSE: líneas "data: {json}". Acumulamos y emitimos el texto nuevo.
    // La metadata de grounding suele llegar en el último fragmento.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let grounding = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const linea = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!linea.startsWith('data:')) continue;
        const json = linea.slice(5).trim();
        if (!json || json === '[DONE]') continue;
        try {
          const obj = JSON.parse(json);
          const cand = obj?.candidates?.[0];
          const t = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
          if (t) yield t;
          if (cand?.groundingMetadata) grounding = cand.groundingMetadata;
        } catch {
          /* fragmento incompleto: se completará en la siguiente lectura */
        }
      }
    }
    if (web && onFuentesWeb) onFuentesWeb(fuentesWebDe(grounding));
  }
}
