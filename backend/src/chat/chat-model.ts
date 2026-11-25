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
export function chatModelConfig(
  env: Record<string, string | undefined>,
): ChatModelConfig | null {
  const groqKey = env.GROQ_API_KEY?.trim();
  if (groqKey)
    return {
      token: groqKey,
      provider: 'groq',
      model: env.GROQ_CHAT_MODEL?.trim() || GROQ_MODEL,
    };
  const hfToken = env.HF_TOKEN?.trim();
  if (hfToken)
    return {
      token: hfToken,
      provider: 'auto',
      model: env.HF_CHAT_MODEL?.trim() || HF_MODEL,
    };
  return null;
}

/**
 * Modelo de chat con el cliente oficial de Hugging Face (@huggingface/inference).
 * Con una clave de Groq, el cliente llama a Groq directamente con el modelo de
 * Hugging Face indicado; con un token de Hugging Face, pasa por su router.
 */
export function huggingFaceChatModel({
  token,
  provider,
  model,
}: ChatModelConfig): ChatModel {
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
        ...(model.startsWith('openai/gpt-oss')
          ? { reasoning_effort: 'low' }
          : {}),
      });
      for await (const chunk of chunks) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    },
  };
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** El texto de cada evento `data: {...}` del streaming (SSE) de una API compatible con OpenAI. */
export async function* sseDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const bytes of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(bytes, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const data = line.trim().replace(/^data:\s*/, '');
      if (!line.trim().startsWith('data:') || data === '[DONE]') continue;
      try {
        const text = (
          JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
        ).choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // Un evento incompleto o de control: se ignora.
      }
    }
  }
}

/**
 * Modelo de chat servido por Groq, llamado directamente con su API compatible con
 * OpenAI. No depende de la tabla de proveedores de Hugging Face, que puede dejar de
 * listar un modelo aunque Groq lo siga sirviendo.
 */
export function groqChatModel(
  { token, model }: ChatModelConfig,
  fetchFn: typeof fetch = fetch,
): ChatModel {
  return {
    async *stream(messages) {
      const response = await fetchFn(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: MAX_TOKENS,
          temperature: 0.4,
          stream: true,
          ...(model.startsWith('openai/gpt-oss')
            ? { reasoning_effort: 'low' }
            : {}),
        }),
      });
      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => '');
        throw new Error(
          `Groq respondió ${response.status}: ${detail.slice(0, 200)}`,
        );
      }
      yield* sseDeltas(response.body);
    },
  };
}

export const chatModelProvider = {
  provide: CHAT_MODEL,
  useFactory: (): ChatModel | null => {
    const config = chatModelConfig(process.env);
    if (!config) return null;
    return config.provider === 'groq'
      ? groqChatModel(config)
      : huggingFaceChatModel(config);
  },
};
