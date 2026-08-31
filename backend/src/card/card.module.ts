import { Module } from '@nestjs/common';
import { PusherModule } from '../pusher/pusher.module';
import { CardController } from './card.controller';
import { CardService } from './card.service';

@Module({
  imports: [PusherModule],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
