import { InferenceClient } from '@huggingface/inference';

/** Un mensaje tal como lo recibe el modelo. */
export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** El modelo de lenguaje: devuelve la respuesta en partes, a medida que la escribe. */
export interface ChatModel {
  stream(messages: ModelMessage[]): AsyncIterable<string>;
}

/** Proveedor de Nest del modelo; es null cuando no hay ninguna clave configurada. */
export const CHAT_MODEL = 'CHAT_MODEL';

/**
 * Modelos por defecto, ambos abiertos en Hugging Face (sin pedir acceso):
 * - Groq (plan gratuito, con GROQ_API_KEY) sirve openai/gpt-oss-20b, rápido y bueno en español.
 * - Hugging Face Inference Providers (con HF_TOKEN, requiere créditos) sirve Qwen2.5-72B.
 */
const GROQ_MODEL = 'openai/gpt-oss-20b';
const HF_MODEL = 'Qwen/Qwen2.5-72B-Instruct';

/** Respuestas cortas: el asistente debe ser breve y así cada pregunta cuesta poco. */
const MAX_TOKENS = 800;

export interface ChatModelConfig {
  token: string;
  /** "groq": la llamada va directo a Groq con su clave; "auto": el router de Hugging Face elige el proveedor. */
  provider: 'groq' | 'auto';
  model: string;
}

/** Qué servicio y modelo usar según las variables de entorno; null si no hay ninguna clave. */
export function chatModelConfig(env: Record<string, string | undefined>): ChatModelConfig | null {
  const groqKey = env.GROQ_API_KEY?.trim();
  if (groqKey) return { token: groqKey, provider: 'groq', model: env.GROQ_CHAT_MODEL?.trim() || GROQ_MODEL };
  const hfToken = env.HF_TOKEN?.trim();
  if (hfToken) return { token: hfToken, provider: 'auto', model: env.HF_CHAT_MODEL?.trim() || HF_MODEL };
  return null;
}

/**
 * Modelo de chat con el cliente oficial de Hugging Face (@huggingface/inference).
 * Con una clave de Groq, el cliente llama a Groq directamente con el modelo de
 * Hugging Face indicado; con un token de Hugging Face, pasa por su router.
 */
export function huggingFaceChatModel({ token, provider, model }: ChatModelConfig): ChatModel {
  const client = new InferenceClient(token);
  return {
    async *stream(messages) {
      const chunks = client.chatCompletionStream({
        provider,
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
        // gpt-oss "piensa" antes de responder; poco basta para preguntas de nutrición y responde antes.
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      });
      for await (const chunk of chunks) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    },
  };
}

export const chatModelProvider = {
  provide: CHAT_MODEL,
  useFactory: (): ChatModel | null => {
    const config = chatModelConfig(process.env);
    return config ? huggingFaceChatModel(config) : null;
  },
};
