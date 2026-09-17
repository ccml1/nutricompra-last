import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around PrismaClient so it participates in Nest's lifecycle
 * (connects on module init, disconnects on module destroy).
 *
 * Intentionally contains NO business logic. Feature modules (foods,
 * nutrition, etc.) will inject this service in a future stage — none of
 * that is implemented yet.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
