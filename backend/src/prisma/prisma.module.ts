import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global module so any future feature module can inject PrismaService
 * without re-importing this module everywhere. No controllers/business
 * logic here — that belongs to feature modules created in later stages.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
