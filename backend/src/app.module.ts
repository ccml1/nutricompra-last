import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { FoodsModule } from './foods/foods.module';
import { PlateModule } from './plate/plate.module';
import { PricesModule } from './prices/prices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // PrismaModule wires up the DB connection (see src/prisma/).
  // FoodsModule serves GET /foods (TPCA catalog with nutrition data).
  // PricesModule serves GET /products (store prices to compare).
  // ChatModule serves POST /chat (nutrition assistant on Hugging Face).
  // PlateModule serves POST /plate/analyze (foods and grams from a plate photo).
  imports: [PrismaModule, FoodsModule, PricesModule, ChatModule, PlateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
