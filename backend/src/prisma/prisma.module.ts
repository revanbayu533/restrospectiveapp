import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module Global untuk PrismaService agar dapat di-inject di modul lain
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
