import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { FoodsModule } from './foods/foods.module';
import { PricesModule } from './prices/prices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // PrismaModule wires up the DB connection (see src/prisma/).
  // FoodsModule serves GET /foods (TPCA catalog with nutrition data).
  // PricesModule serves GET /products (store prices to compare).
  // ChatModule serves POST /chat (nutrition assistant on Hugging Face).
  imports: [PrismaModule, FoodsModule, PricesModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
