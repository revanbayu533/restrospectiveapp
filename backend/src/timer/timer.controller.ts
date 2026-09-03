import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartTimerDto, UpdateDurationDto } from './dto/timer.dto';
import { TimerService } from './timer.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Get('boards/:id/timer')
  async getTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.getTimer(userId, boardId);
  }

  @Post('boards/:id/timer/start')
  async startTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() startTimerDto: StartTimerDto,
  ) {
    return this.timerService.startTimer(userId, boardId, startTimerDto);
  }

  @Post('boards/:id/timer/pause')
  async pauseTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.pauseTimer(userId, boardId);
  }

  @Post('boards/:id/timer/reset')
  async resetTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.resetTimer(userId, boardId);
  }

  @Patch('boards/:id/timer/duration')
  async updateDuration(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() updateDurationDto: UpdateDurationDto,
  ) {
    return this.timerService.updateDuration(userId, boardId, updateDurationDto);
  }
}
