import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { BodyService } from './body.service';

@Controller('body')
export class BodyController {
  constructor(private readonly body: BodyService) {}

  /**
   * POST /body/estimate-weight { image, sex: "male" | "female", age, heightCm }
   * → { weightKg, lowKg, highKg }; 422 con `reason` si la foto no sirve.
   */
  @Post('estimate-weight')
  @HttpCode(200)
  estimateWeight(@Body() body: unknown) {
    return this.body.estimateWeight(body);
  }
}
