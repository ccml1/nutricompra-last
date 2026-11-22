import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  VISION_MODEL,
  VisionModelError,
  type VisionModel,
} from '../plate/vision-model';

/** Fotos de hasta ~1.5 MB (la pantalla las achica antes de enviarlas). */
const MAX_IMAGE_CHARS = 2_000_000;

/** IMC posibles para un adulto: el peso estimado nunca sale de este rango para su estatura. */
const MIN_BMI = 15;
const MAX_BMI = 50;

/** Un rango más estrecho que ±6 % prometería una precisión que una foto no tiene. */
const MIN_RANGE_SHARE = 0.06;

export type Sex = 'male' | 'female';

export interface WeightEstimate {
  weightKg: number;
  lowKg: number;
  highKg: number;
}

/** Por qué una foto no recibe número. */
export const UNUSABLE_REASONS = {
  no_person:
    'No vemos a una persona en la foto. Sube una foto de cuerpo entero.',
  multiple_people:
    'Parece que hay más de una persona en la foto. Sube una foto en la que salgas solo tú.',
  minor: 'La estimación es solo para adultos (18 años o más).',
  face_only:
    'Solo se ve la cara o parte del cuerpo. Sube una foto de cuerpo entero, de la cabeza a los pies.',
  obscured:
    'La ropa holgada o la postura tapan la silueta. Prueba con ropa ajustada y de frente a la cámara.',
  poor_quality:
    'La foto está muy oscura, borrosa o lejos. Prueba con buena luz y a 2 o 3 metros.',
} as const;

export type UnusableReason = keyof typeof UNUSABLE_REASONS;

/** Instrucción para el modelo: qué mirar, con qué escala y cómo responder. */
export function bodyPrompt(sex: Sex, age: number, heightCm: number): string {
  const person = `${sex === 'male' ? 'un hombre' : 'una mujer'} de ${age} años que mide ${heightCm} cm`;
  return [
    'Eres un antropometrista que estima el peso corporal de adultos a partir de una foto.',
    `La foto es de ${person}.`,
    'Usa la estatura como escala y mira el ancho y el grosor de hombros, pecho, cintura, caderas, brazos y muslos.',
    'Ten en cuenta que la ropa holgada oculta la silueta y que el músculo pesa más que la grasa.',
    'Da tu mejor estimación del peso en kilos y un rango honesto (mínimo y máximo) que refleje tu incertidumbre.',
    `Si no puedes estimar, responde usable false y el motivo: ${Object.keys(UNUSABLE_REASONS).join(', ')}.`,
    'Responde solo con JSON, sin texto adicional:',
    '{"usable": true, "reason": null, "weightKg": 72, "lowKg": 66, "highKg": 79}',
  ].join('\n');
}

/** El primer objeto JSON del texto, aunque venga dentro de ```json o con texto alrededor. */
function parseJson(text: string): Record<string, unknown> {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start)
    throw new Error('La respuesta no trae JSON');
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Lo que dijo el modelo, dentro de lo posible: el peso entre IMC 15 y 50 para
 * esa estatura, el rango ordenado alrededor del peso y nunca más estrecho que ±6 %.
 */
export function guardEstimate(
  heightCm: number,
  raw: { weightKg?: unknown; lowKg?: unknown; highKg?: unknown },
): WeightEstimate | null {
  if (!isNumber(raw.weightKg)) return null;
  const metres = heightCm / 100;
  const minKg = MIN_BMI * metres * metres;
  const maxKg = MAX_BMI * metres * metres;
  const within = (kg: number) => Math.min(maxKg, Math.max(minKg, kg));

  const weight = within(raw.weightKg);
  const [low, high] = [raw.lowKg, raw.highKg]
    .map((kg) => (isNumber(kg) ? kg : weight))
    .sort((a, b) => a - b);
  return {
    weightKg: Math.round(weight),
    lowKg: Math.floor(within(Math.min(low, weight * (1 - MIN_RANGE_SHARE)))),
    highKg: Math.ceil(within(Math.max(high, weight * (1 + MIN_RANGE_SHARE)))),
  };
}

@Injectable()
export class BodyService {
  constructor(
    @Inject(VISION_MODEL) private readonly model: VisionModel | null,
  ) {}

  /** El peso aproximado de la persona de la foto, con su rango. */
  async estimateWeight(body: unknown): Promise<WeightEstimate> {
    const { image, sex, age, heightCm } = (body ?? {}) as Record<
      string,
      unknown
    >;
    if (
      typeof image !== 'string' ||
      !/^data:image\/(jpeg|png|webp);base64,/.test(image)
    ) {
      throw new BadRequestException(
        'Falta la foto (una imagen JPEG, PNG o WebP).',
      );
    }
    if (image.length > MAX_IMAGE_CHARS)
      throw new PayloadTooLargeException('La foto es demasiado grande.');
    if (sex !== 'male' && sex !== 'female')
      throw new BadRequestException('Elige el sexo.');
    if (!isNumber(age) || age < 18 || age > 100) {
      throw new BadRequestException(
        'La estimación es solo para adultos: la edad va de 18 a 100 años.',
      );
    }
    if (!isNumber(heightCm) || heightCm < 120 || heightCm > 230) {
      throw new BadRequestException(
        'La estatura debe estar entre 120 y 230 cm.',
      );
    }
    if (!this.model) {
      throw new ServiceUnavailableException(
        'La estimación por foto no está configurada (falta GROQ_API_KEY en el backend).',
      );
    }

    let raw: Record<string, unknown>;
    try {
      raw = parseJson(
        await this.model.describe(
          image,
          bodyPrompt(sex, Math.round(age), Math.round(heightCm)),
        ),
      );
    } catch (error) {
      if (error instanceof VisionModelError && error.status === 429) {
        throw new HttpException(
          'Analizamos muchas fotos seguidas. Espera unos segundos e inténtalo de nuevo.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      console.error('El modelo de visión no respondió bien:', error);
      throw new BadGatewayException(
        'No pudimos analizar la foto. Inténtalo de nuevo.',
      );
    }

    if (raw.usable === false) {
      const reason: UnusableReason =
        typeof raw.reason === 'string' && raw.reason in UNUSABLE_REASONS
          ? (raw.reason as UnusableReason)
          : 'poor_quality';
      throw new UnprocessableEntityException({
        statusCode: 422,
        reason,
        message: UNUSABLE_REASONS[reason],
      });
    }
    const estimate = guardEstimate(heightCm, raw);
    if (!estimate) {
      throw new BadGatewayException(
        'No pudimos analizar la foto. Inténtalo de nuevo.',
      );
    }
    return estimate;
  }
}
