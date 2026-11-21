import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FoodsService } from '../foods/foods.service';
import { normalizeSearchText } from '../prices/search-text';
import { VISION_MODEL, VisionModelError, type VisionModel } from './vision-model';

/** Fotos de hasta ~1.5 MB (la pantalla las achica a ~150 KB antes de enviarlas). */
const MAX_IMAGE_CHARS = 2_000_000;
const MAX_FOODS = 12;

export interface PlateFood {
  name: string;
  /** Gramos como está servido (cocido). */
  grams: number;
  /** true si el nombre es de la tabla TPCA: sus nutrientes salen de ahí. */
  inCatalog: boolean;
  /** Valor estimado por el modelo por 100 g, solo para lo que no está en la TPCA. */
  per100g?: { kcal: number; proteinG: number; carbsG: number; fatG: number };
}

export interface PlateAnalysis {
  dish: string | null;
  foods: PlateFood[];
}

/** Número entre min y max con un decimal; lo que no es número cuenta como min. */
const clamp = (value: unknown, min: number, max: number) => {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, Math.round(number * 10) / 10));
};

/** Instrucción para el modelo: qué ver, cómo estimar los gramos y con qué nombres responder. */
export function platePrompt(catalogNames: string[]): string {
  return [
    'Eres un nutricionista que analiza fotos de comida peruana.',
    'Mira la foto y lista cada alimento que se ve con sus gramos tal como están servidos (cocidos).',
    'Para estimar los gramos usa como referencia que un plato llano normal mide unos 26 cm de diámetro y una taza unos 8 cm.',
    'Separa los platos en sus ingredientes visibles (por ejemplo, un lomo saltado en carne de res, cebolla, tomate, papa y arroz).',
    `Cuando un alimento corresponda a uno de esta lista de la Tabla Peruana de Composición de Alimentos, usa exactamente ese nombre: ${catalogNames.join(', ')}.`,
    'Si no está en la lista (pan, queso amarillo, salsas, frituras...), usa su nombre común en español y agrega su valor estimado por 100 g en "per100g".',
    'Responde solo con JSON, sin texto adicional:',
    '{"dish": "nombre del plato en español", "foods": [{"name": "Arroz blanco", "grams": 150}, {"name": "Pan francés", "grams": 40, "per100g": {"kcal": 270, "proteinG": 9, "carbsG": 52, "fatG": 3}}]}',
    'Si la foto no muestra comida, responde {"dish": null, "foods": []}.',
  ].join('\n');
}

/** El primer objeto JSON del texto, aunque venga dentro de ```json o con texto alrededor. */
function parseJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('La respuesta no trae JSON');
  return JSON.parse(text.slice(start, end + 1));
}

@Injectable()
export class PlateService {
  constructor(
    private readonly foods: FoodsService,
    @Inject(VISION_MODEL) private readonly model: VisionModel | null,
  ) {}

  /** Los alimentos de la foto con sus gramos, con los nombres de la TPCA cuando corresponden. */
  async analyze(body: unknown): Promise<PlateAnalysis> {
    const image = (body as { image?: unknown })?.image;
    if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
      throw new BadRequestException('Falta la foto (una imagen JPEG, PNG o WebP).');
    }
    if (image.length > MAX_IMAGE_CHARS) throw new PayloadTooLargeException('La foto es demasiado grande.');
    if (!this.model) {
      throw new ServiceUnavailableException('El análisis de fotos no está configurado (falta GROQ_API_KEY en el backend).');
    }

    const catalog = (await this.foods.findAll()).map((food) => food.name);
    const byNormalizedName = new Map(catalog.map((name) => [normalizeSearchText(name), name]));

    let raw: unknown;
    try {
      raw = parseJson(await this.model.describe(image, platePrompt(catalog)));
    } catch (error) {
      if (error instanceof VisionModelError && error.status === 429) {
        throw new HttpException(
          'Analizamos muchas fotos seguidas. Espera unos segundos e inténtalo de nuevo.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      console.error('El modelo de visión no respondió bien:', error);
      throw new BadGatewayException('No pudimos analizar la foto. Inténtalo de nuevo.');
    }

    const { dish, foods } = (raw ?? {}) as { dish?: unknown; foods?: unknown };
    const parsed = (Array.isArray(foods) ? foods : []).flatMap((food: Record<string, unknown>): PlateFood[] => {
      const name = typeof food?.name === 'string' ? food.name.trim().slice(0, 60) : '';
      if (!name) return [];
      const grams = clamp(food.grams, 1, 1500);
      const catalogName = byNormalizedName.get(normalizeSearchText(name));
      if (catalogName) return [{ name: catalogName, grams, inCatalog: true }];
      const per100g = (food.per100g ?? {}) as Record<string, unknown>;
      return [
        {
          name,
          grams,
          inCatalog: false,
          per100g: {
            kcal: clamp(per100g.kcal, 0, 900),
            proteinG: clamp(per100g.proteinG, 0, 100),
            carbsG: clamp(per100g.carbsG, 0, 100),
            fatG: clamp(per100g.fatG, 0, 100),
          },
        },
      ];
    });
    return {
      dish: typeof dish === 'string' && dish.trim() ? dish.trim().slice(0, 80) : null,
      foods: parsed.slice(0, MAX_FOODS),
    };
  }
}
