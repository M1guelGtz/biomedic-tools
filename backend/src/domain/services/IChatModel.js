// Puerto (interfaz) del modelo de chat. -> Patrón Adapter/Strategy.
// Implementaciones: Gemini, compatible-OpenAI (DeepSeek/Groq/Ollama), etc.

/* eslint-disable no-unused-vars */
export class IChatModel {
  /**
   * Genera una respuesta de texto.
   * @param {{ system?: string, prompt: string, temperature?: number }} opts
   * @returns {Promise<string>}
   */
  async generar(opts) {
    throw new Error('No implementado: generar()');
  }

  /**
   * Genera la respuesta en streaming (async generator que produce trozos de texto).
   * Opcional: si un adaptador no lo implementa, el RAG usa generar() como fallback.
   * @param {{ system?: string, prompt: string, temperature?: number }} opts
   * @returns {AsyncGenerator<string>}
   */
  // eslint-disable-next-line require-yield
  async *generarStream(opts) {
    throw new Error('No implementado: generarStream()');
  }
}
