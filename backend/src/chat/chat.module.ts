import { Module } from '@nestjs/common';
import { FoodsService } from '../foods/foods.service';
import { chatModelProvider } from './chat-model';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  // FoodsService da los nutrientes del catálogo TPCA que el asistente cita.
  providers: [ChatService, FoodsService, chatModelProvider],
})
export class ChatModule {}
