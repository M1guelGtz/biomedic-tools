// Adaptador de chat para cualquier API compatible con OpenAI:
// DeepSeek, Groq, Ollama (con /v1), OpenRouter, OpenAI...
// Se configura con AI_BASE_URL + AI_API_KEY + AI_CHAT_MODEL.

import { IChatModel } from '../../domain/services/IChatModel.js';

export class OpenAICompatibleChatModel extends IChatModel {
  constructor({ baseUrl, apiKey, model }) {
    super();
    this.baseUrl = baseUrl?.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.model = model;
  }

  async generar({ system, prompt, temperature = 0.2 }) {
    if (!this.baseUrl) throw new Error('Falta AI_BASE_URL para el proveedor compatible-OpenAI');

    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: this.model, messages, temperature }),
    });
    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Chat falló (${res.status}): ${detalle.slice(0, 300)}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? '';
  }

  async *generarStream({ system, prompt, temperature = 0.2 }) {
    if (!this.baseUrl) throw new Error('Falta AI_BASE_URL para el proveedor compatible-OpenAI');

    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: this.model, messages, temperature, stream: true }),
    });
    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Chat stream falló (${res.status}): ${detalle.slice(0, 300)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
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
          const t = obj?.choices?.[0]?.delta?.content ?? '';
          if (t) yield t;
        } catch {
          /* fragmento incompleto */
        }
      }
    }
  }
}
