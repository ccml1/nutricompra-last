import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** GET /products?q=leche gloria (si `q` se repite, se buscan todas sus palabras). */
  @Get()
  search(@Query('q') query: string | string[] = '') {
    return this.productsService.search(Array.isArray(query) ? query.join(' ') : query);
  }
}
