import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PusherModule } from '../pusher/pusher.module';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  imports: [PrismaModule, PusherModule],
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
