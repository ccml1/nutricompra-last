import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PlateService } from './plate.service';

@Controller('plate')
export class PlateController {
  constructor(private readonly plate: PlateService) {}

  /** POST /plate/analyze { image: "data:image/jpeg;base64,..." } → el plato y sus alimentos con gramos. */
  @Post('analyze')
  @HttpCode(200)
  analyze(@Body() body: unknown) {
    return this.plate.analyze(body);
  }
}
