import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('cards/:id/comments')
  async createComment(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createComment(userId, cardId, createCommentDto);
  }

  @Get('cards/:id/comments')
  async getCardComments(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.commentService.getCardComments(userId, cardId);
  }

  @Delete('comments/:id')
  async deleteComment(
    @GetUser('id') userId: string,
    @Param('id') commentId: string,
  ) {
    return this.commentService.deleteComment(userId, commentId);
  }
}
