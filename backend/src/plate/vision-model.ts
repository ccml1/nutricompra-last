/** Un modelo que mira una foto y responde un texto a partir de una instrucción. */
export interface VisionModel {
  describe(imageDataUrl: string, prompt: string): Promise<string>;
}

/** Proveedor de Nest del modelo de visión; es null cuando falta GROQ_API_KEY. */
export const VISION_MODEL = 'VISION_MODEL';

/** Error del proveedor con su código HTTP (429 = pide esperar). */
export class VisionModelError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Qwen3.8-27B: modelo abierto de Alibaba publicado en Hugging Face
 * (Qwen/Qwen3.8-27B) que entiende imágenes; Groq lo sirve en su plan gratuito.
 * Se cambia con GROQ_VISION_MODEL.
 */
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Espera máxima cuando Groq pide esperar (429). Su plan gratuito admite ~7000 fichas
 * de entrada por minuto y cada foto usa ~2400, así que la tercera foto seguida suele
 * tener que esperar unos segundos: es mejor esperar que caer al reconocimiento básico.
 */
const MAX_RETRY_WAIT_MS = 30_000;

/** Segundos que Groq pide esperar: cabecera retry-after o "try again in 9.48s" en el mensaje. */
export function retryAfterMs(
  retryAfter: string | null,
  message: string,
): number | null {
  const seconds =
    Number(retryAfter) || Number(/try again in ([\d.]+)s/i.exec(message)?.[1]);
  return seconds > 0 ? Math.ceil(seconds * 1000) : null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function groqVisionModel(
  apiKey: string,
  model: string,
  deps: { fetch: typeof fetch; sleep: (ms: number) => Promise<unknown> } = {
    fetch,
    sleep: wait,
  },
): VisionModel {
  const call = async (
    imageDataUrl: string,
    prompt: string,
    retried: boolean,
  ): Promise<string> => {
    const response = await deps.fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
    const body = (await response.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    } | null;
    if (!response.ok) {
      const message =
        body?.error?.message ?? `Groq respondió ${response.status}`;
      const delay =
        response.status === 429
          ? retryAfterMs(response.headers.get('retry-after'), message)
          : null;
      if (!retried && delay !== null && delay <= MAX_RETRY_WAIT_MS) {
        await deps.sleep(delay + 250);
        return call(imageDataUrl, prompt, true);
      }
      if (delay !== null) {
        console.warn(`Groq pidió esperar ${delay} ms; no se reintenta.`);
      }
      throw new VisionModelError(response.status, message);
    }
    return body?.choices?.[0]?.message?.content ?? '';
  };
  return {
    describe: (imageDataUrl, prompt) => call(imageDataUrl, prompt, false),
  };
}

export const visionModelProvider = {
  provide: VISION_MODEL,
  useFactory: (): VisionModel | null => {
    const key = process.env.GROQ_API_KEY?.trim();
    return key
      ? groqVisionModel(
          key,
          process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_MODEL,
        )
      : null;
  },
};
