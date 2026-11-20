import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FoodsService } from '../foods/foods.service';
import { CHAT_MODEL, type ChatModel, type ModelMessage } from './chat-model';
import { systemPrompt, type CatalogFood, type ChatContext } from './chat-prompt';
import { matchFoods } from './match-foods';

/** Mensajes de la conversación que se mandan como máximo (los más recientes). */
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1000;

/** Preguntas por persona en la ventana de tiempo, para que nadie agote los créditos de Hugging Face. */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** El catálogo cambia muy poco: se lee de la base cada 10 minutos como mucho. */
const CATALOG_TTL_MS = 10 * 60 * 1000;

type ConversationMessage = { role: 'user' | 'assistant'; content: string };

/** Texto recortado, o undefined si no es texto. */
const text = (value: unknown, max = 80) => (typeof value === 'string' ? value.trim().slice(0, max) : undefined);
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined);

/** Valida la conversación: 1 a 20 mensajes de usuario o asistente, el último del usuario. */
function parseMessages(body: unknown): ConversationMessage[] {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new BadRequestException('Falta la pregunta.');
  }
  const parsed = messages.slice(-MAX_MESSAGES).map((message: unknown) => {
    const { role, content } = (message ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) {
      throw new BadRequestException('Cada mensaje necesita un rol (user o assistant) y un texto.');
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      throw new BadRequestException(`Cada mensaje puede tener hasta ${MAX_MESSAGE_CHARS} caracteres.`);
    }
    return { role, content: content.trim() } as ConversationMessage;
  });
  if (parsed.at(-1)?.role !== 'user') throw new BadRequestException('La conversación debe terminar con la pregunta del usuario.');
  return parsed;
}

/** Datos del hogar, recortados: lo que no tiene la forma esperada se descarta. */
function parseContext(body: unknown): ChatContext {
  const raw = ((body as { context?: unknown })?.context ?? {}) as Record<string, unknown>;
  const menu = Array.isArray(raw.menu)
    ? raw.menu.slice(0, 7).flatMap((day: Record<string, unknown>) => {
        const name = text(day?.day, 20);
        if (!name || !Array.isArray(day.meals)) return [];
        const meals = day.meals.slice(0, 6).flatMap((meal: Record<string, unknown>) => {
          const type = text(meal?.type, 20);
          const mealName = text(meal?.name);
          return type && mealName ? [{ type, name: mealName, kcal: num(meal.kcal) ?? 0 }] : [];
        });
        return [{ day: name, meals, kcal: num(day.kcal) ?? 0, proteinG: num(day.proteinG) ?? 0, carbsG: num(day.carbsG) ?? 0, fatG: num(day.fatG) ?? 0 }];
      })
    : undefined;
  const shoppingList = Array.isArray(raw.shoppingList)
    ? raw.shoppingList.slice(0, 60).flatMap((item: Record<string, unknown>) => {
        const name = text(item?.name);
        return name ? [{ name, quantity: text(item.quantity, 30) ?? '' }] : [];
      })
    : undefined;
  return { weeklyBudget: num(raw.weeklyBudget), menu, shoppingList, shoppingTotal: num(raw.shoppingTotal) };
}

@Injectable()
export class ChatService {
  private readonly requests = new Map<string, number[]>();
  private catalog: { readAt: number; foods: CatalogFood[] } | null = null;

  constructor(
    private readonly foods: FoodsService,
    @Inject(CHAT_MODEL) private readonly model: ChatModel | null,
  ) {}

  /** Cuenta la pregunta de esta persona y falla si ya hizo demasiadas en la ventana. */
  private checkRateLimit(client: string) {
    const now = Date.now();
    const recent = (this.requests.get(client) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
    if (recent.length >= RATE_LIMIT) {
      throw new HttpException('Hiciste muchas preguntas seguidas. Espera unos minutos.', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.requests.set(client, [...recent, now]);
  }

  private async catalogFoods(): Promise<CatalogFood[]> {
    if (!this.catalog || Date.now() - this.catalog.readAt > CATALOG_TTL_MS) {
      this.catalog = { readAt: Date.now(), foods: await this.foods.findAll() };
    }
    return this.catalog.foods;
  }

  /**
   * Respuesta del modelo en partes. Espera la primera parte antes de devolver,
   * para que un fallo del modelo se pueda informar con un error HTTP claro.
   */
  async reply(body: unknown, client: string): Promise<{ first: string; rest: AsyncIterator<string> }> {
    const conversation = parseMessages(body);
    const context = parseContext(body);
    if (!this.model) throw new ServiceUnavailableException('El chat no está configurado (falta GROQ_API_KEY o HF_TOKEN en el backend).');
    this.checkRateLimit(client);

    const question = conversation.at(-1)!.content;
    const foods = matchFoods(question, await this.catalogFoods());
    const messages: ModelMessage[] = [{ role: 'system', content: systemPrompt(context, foods) }, ...conversation];

    const iterator = this.model.stream(messages)[Symbol.asyncIterator]();
    try {
      const first = await iterator.next();
      return { first: first.done ? '' : first.value, rest: iterator };
    } catch (error) {
      console.error('El modelo de Hugging Face no respondió:', error);
      throw new BadGatewayException('El modelo no pudo responder. Intenta de nuevo en un momento.');
    }
  }
}
