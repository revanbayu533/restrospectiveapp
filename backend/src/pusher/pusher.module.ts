import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PusherController } from './pusher.controller';
import { PusherService } from './pusher.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PusherController],
  providers: [PusherService],
  exports: [PusherService],
})
export class PusherModule {}

