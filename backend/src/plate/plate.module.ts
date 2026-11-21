import { Module } from '@nestjs/common';
import { FoodsService } from '../foods/foods.service';
import { PlateController } from './plate.controller';
import { PlateService } from './plate.service';
import { visionModelProvider } from './vision-model';

@Module({
  controllers: [PlateController],
  // FoodsService da los nombres del catálogo TPCA que el modelo debe usar.
  providers: [PlateService, FoodsService, visionModelProvider],
})
export class PlateModule {}
