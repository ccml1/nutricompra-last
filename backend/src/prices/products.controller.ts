import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** GET /products?q=leche gloria */
  @Get()
  search(@Query('q') query = '') {
    return this.productsService.search(query);
  }
}
