import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // PrismaModule only wires up the DB connection (see src/prisma/).
  // No feature/business modules (foods, nutrition, etc.) exist yet —
  // those are out of scope for this stage.
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
