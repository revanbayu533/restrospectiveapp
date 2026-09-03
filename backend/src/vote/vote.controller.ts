import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoteService } from './vote.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post('cards/:id/vote')
  async voteCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.voteService.voteCard(userId, cardId);
  }

  @Delete('cards/:id/vote')
  async unvoteCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.voteService.unvoteCard(userId, cardId);
  }
}
