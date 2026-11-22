import { Module } from '@nestjs/common';
import { visionModelProvider } from '../plate/vision-model';
import { BodyController } from './body.controller';
import { BodyService } from './body.service';

@Module({
  controllers: [BodyController],
  // El mismo modelo de visión abierto (Qwen3.8 en Groq) que analiza la foto del plato.
  providers: [BodyService, visionModelProvider],
})
export class BodyModule {}
