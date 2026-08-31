import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
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

  @Delete('cards/:id')
  async deleteCard(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.cardService.deleteCard(userId, cardId);
  }
}
