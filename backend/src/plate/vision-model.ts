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

export function groqVisionModel(apiKey: string, model: string): VisionModel {
  return {
    async describe(imageDataUrl, prompt) {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
        throw new VisionModelError(response.status, body?.error?.message ?? `Groq respondió ${response.status}`);
      }
      return body?.choices?.[0]?.message?.content ?? '';
    },
  };
}

export const visionModelProvider = {
  provide: VISION_MODEL,
  useFactory: (): VisionModel | null => {
    const key = process.env.GROQ_API_KEY?.trim();
    return key ? groqVisionModel(key, process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_MODEL) : null;
  },
};
