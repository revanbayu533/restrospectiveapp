import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from './pusher.service';

/**
 * Controller untuk autentikasi Private / Presence channel Pusher
 * Endpoint: POST /api/pusher/auth
 */
@UseGuards(JwtAuthGuard)
@Controller('pusher')
export class PusherController {
  constructor(
    private readonly pusherService: PusherService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('auth')
  async authenticateUser(
    @GetUser('id') userId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    // Tangani socket_id & channel_name baik dari JSON body maupun urlencoded form
    const socketId = body.socket_id || body.socketId || req.body?.socket_id;
    const channelName = body.channel_name || body.channelName || body.channel || req.body?.channel_name;

    if (!socketId || !channelName) {
      throw new BadRequestException('socket_id dan channel_name harus disertakan');
    }

    // Jika channel adalah private-board-{boardId} atau board-{boardId}
    const boardMatch = channelName.match(/(?:private-)?board-(.+)$/);
    if (boardMatch) {
      const boardId = boardMatch[1];

      // Verifikasi apakah board ada dan user adalah anggota workspace board tersebut
      const board = await this.prisma.board.findUnique({
        where: { id: boardId },
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!board) {
        throw new ForbiddenException('Board tidak ditemukan');
      }

      const isMember = board.workspace.members && board.workspace.members.length > 0;
      const isOwner = board.workspace.ownerId === userId;

      if (!isMember && !isOwner) {
        throw new ForbiddenException('Anda tidak memiliki akses ke board workspace ini');
      }
    }

    // Ambil data user untuk presence channel jika diperlukan
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const presenceData = {
      user_id: userId,
      user_info: {
        id: userId,
        name: user?.name || user?.email?.split('@')[0] || 'Member',
        email: user?.email,
      },
    };

    // Otorisasi channel via Pusher Server SDK
    try {
      const authResponse = this.pusherService.authorizeChannel(socketId, channelName, presenceData);
      return authResponse;
    } catch (err) {
      throw new BadRequestException(`Gagal mengotorisasi channel Pusher: ${err.message}`);
    }
  }
}
