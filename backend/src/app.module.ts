import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FoodsModule } from './foods/foods.module';
import { PricesModule } from './prices/prices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // PrismaModule wires up the DB connection (see src/prisma/).
  // FoodsModule serves GET /foods (TPCA catalog with nutrition data).
  // PricesModule serves GET /products (store prices to compare).
  imports: [PrismaModule, FoodsModule, PricesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
