import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products?q=leche gloria&sort=price-asc (si `q` se repite, se buscan
   * todas sus palabras). `sort`: relevance (por defecto), price-asc, price-desc o unit-price
   * (menor precio por kg o L).
   */
  @Get()
  search(@Query('q') query: string | string[] = '', @Query('sort') sort?: string | string[]) {
    return this.productsService.search(
      Array.isArray(query) ? query.join(' ') : query,
      Array.isArray(sort) ? sort[0] : sort,
    );
  }
}
