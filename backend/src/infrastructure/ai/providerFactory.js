// Factory que selecciona el proveedor de IA según la configuración.
// Cambiar de Gemini a DeepSeek/Ollama = cambiar AI_PROVIDER en el .env.
// -> Patrón Factory + Strategy.

import { GeminiChatModel } from './GeminiChatModel.js';
import { GeminiEmbeddingProvider } from './GeminiEmbeddingProvider.js';
import { OpenAICompatibleChatModel } from './OpenAICompatibleChatModel.js';
import { OpenAICompatibleEmbeddingProvider } from './OpenAICompatibleEmbeddingProvider.js';

export function crearProveedorIA(aiConfig) {
  switch (aiConfig.provider) {
    case 'gemini':
      return {
        chatModel: new GeminiChatModel({
          apiKey: aiConfig.gemini.apiKey,
          model: aiConfig.chatModel,
        }),
        embeddingProvider: new GeminiEmbeddingProvider({
          apiKey: aiConfig.gemini.apiKey,
          model: aiConfig.embeddingModel,
          dim: aiConfig.embeddingDim,
        }),
      };

    case 'openai':
      return {
        chatModel: new OpenAICompatibleChatModel({
          baseUrl: aiConfig.openai.baseUrl,
          apiKey: aiConfig.openai.apiKey,
          model: aiConfig.chatModel,
        }),
        embeddingProvider: new OpenAICompatibleEmbeddingProvider({
          baseUrl: aiConfig.openai.baseUrl,
          apiKey: aiConfig.openai.apiKey,
          model: aiConfig.embeddingModel,
        }),
      };

    default:
      throw new Error(`Proveedor de IA desconocido: ${aiConfig.provider} (usa 'gemini' u 'openai')`);
  }
}
