import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { GroupCardDto } from './dto/group-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('boards/:id/cards')
  async createCard(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardService.createCard(userId, boardId, createCardDto);
  }

  @Get('boards/:id/cards')
  async getBoardCards(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.cardService.getBoardCards(userId, boardId);
  }

  @Patch('cards/:id')
  async updateCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardService.updateCard(userId, cardId, updateCardDto);
  }

  @Patch('cards/:id/group')
  async groupCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
    @Body() groupCardDto: GroupCardDto,
  ) {
    return this.cardService.groupCard(userId, cardId, groupCardDto);
  }

  @Patch('cards/:id/move')
  async moveCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
    @Body() moveCardDto: { columnId: string },
  ) {
    return this.cardService.moveCard(userId, cardId, moveCardDto);
  }

  @Patch('cards/groups/:groupId/title')
  async updateGroupTitle(
    @GetUser('id') userId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupTitleDto: { groupTitle: string },
  ) {
    return this.cardService.updateGroupTitle(userId, groupId, updateGroupTitleDto);
  }

  @Patch('cards/groups/:groupId/move')
  async moveGroup(
    @GetUser('id') userId: string,
    @Param('groupId') groupId: string,
    @Body() moveGroupDto: { columnId: string },
  ) {
    return this.cardService.moveGroup(userId, groupId, moveGroupDto);
  }

  @Delete('cards/:id')
  async deleteCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.cardService.deleteCard(userId, cardId);
  }
}
