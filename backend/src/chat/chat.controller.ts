import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';

/** La persona que pregunta: su IP real detrás del proxy de Vercel, o la de la conexión. */
function clientOf(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || request.ip || 'desconocido';
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * POST /chat { messages: [{ role, content }], context } → la respuesta del
   * asistente como texto plano, enviada en partes a medida que el modelo escribe.
   */
  @Post()
  @HttpCode(200)
  async ask(@Body() body: unknown, @Req() request: Request, @Res() response: Response) {
    const { first, rest } = await this.chat.reply(body, clientOf(request));

    response.status(200);
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    // Sin búfer intermedio: cada parte llega a la pantalla apenas el modelo la escribe.
    response.setHeader('X-Accel-Buffering', 'no');
    let closed = false;
    response.on('close', () => {
      closed = true;
    });

    response.write(first);
    try {
      for (;;) {
        if (closed) {
          await rest.return?.();
          break;
        }
        const next = await rest.next();
        if (next.done) break;
        response.write(next.value);
      }
    } catch (error) {
      console.error('La respuesta del modelo se cortó:', error);
      response.write('\n\n(La respuesta se cortó. Intenta de nuevo.)');
    } finally {
      response.end();
    }
  }
}
