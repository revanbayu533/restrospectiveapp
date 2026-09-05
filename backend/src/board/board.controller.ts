import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { SetAnonymousDto } from './dto/set-anonymous.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('workspaces/:workspaceId/boards')
  async createBoard(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardService.createBoard(userId, workspaceId, createBoardDto);
  }

  @Get('workspaces/:workspaceId/boards')
  async getWorkspaceBoards(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.boardService.getWorkspaceBoards(userId, workspaceId);
  }

  @Get('boards/templates')
  async getTemplates() {
    return this.boardService.getTemplates();
  }

  @Get('boards/:id')
  async getBoardById(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.boardService.getBoardById(userId, boardId);
  }

  @Patch('boards/:id/anonymous')
  async setAnonymous(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() setAnonymousDto: SetAnonymousDto,
  ) {
    return this.boardService.setAnonymous(userId, boardId, setAnonymousDto);
  }

  @Delete('boards/:id')
  async deleteBoard(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.boardService.deleteBoard(userId, boardId);
  }
}

