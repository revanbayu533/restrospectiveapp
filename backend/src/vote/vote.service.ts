import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class VoteService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  /**
   * Pengecekan Otorisasi Keanggotaan Workspace Berdasarkan Card ID
   */
  private async checkCardAccess(userId: string, cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    const isMember = card.board.workspace.members.length > 0;
    if (!isMember) {
      throw new ForbiddenException('Anda tidak memiliki akses ke board ini');
    }

    return card;
  }

  /**
   * Memberikan Vote pada Card
   */
  async voteCard(userId: string, cardId: string) {
    const card = await this.checkCardAccess(userId, cardId);

    // 1. Cek Vote Limit board jika ditentukan
    if (card.board.voteLimit && card.board.voteLimit > 0) {
      const userVoteCount = await this.prisma.vote.count({
        where: {
          userId,
          card: {
            boardId: card.boardId,
          },
        },
      });

      if (userVoteCount >= card.board.voteLimit) {
        throw new BadRequestException(`Batas maksimal vote (${card.board.voteLimit}) untuk board ini telah tercapai`);
      }
    }

    // 2. Cek apakah user sudah pernah vote card ini
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (existingVote) {
      throw new BadRequestException('Anda sudah memberikan vote pada card ini');
    }

    // 3. Simpan Vote ke database
    await this.prisma.vote.create({
      data: {
        cardId,
        userId,
      },
    });

    // 4. Ambil data vote terbaru untuk card ini
    const votes = await this.prisma.vote.findMany({
      where: { cardId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    const voteCount = votes.length;

    // 5. Broadcast Pusher Realtime Event ke channel board
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'vote.updated', {
        cardId,
        boardId: card.boardId,
        voteCount,
        votes,
        userId,
        action: 'vote',
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast vote.updated:`, err.message);
    }

    return {
      message: 'Vote berhasil ditambahkan',
      cardId,
      voteCount,
      votes,
    };
  }

  /**
   * Menghapus (Unvote) pada Card
   */
  async unvoteCard(userId: string, cardId: string) {
    const card = await this.checkCardAccess(userId, cardId);

    // 1. Cari vote user pada card ini
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (!existingVote) {
      throw new NotFoundException('Vote tidak ditemukan pada card ini');
    }

    // 2. Hapus vote dari database
    await this.prisma.vote.delete({
      where: {
        id: existingVote.id,
      },
    });

    // 3. Ambil data vote terbaru setelah dihapus
    const votes = await this.prisma.vote.findMany({
      where: { cardId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    const voteCount = votes.length;

    // 4. Broadcast Pusher Realtime Event ke channel board
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'vote.updated', {
        cardId,
        boardId: card.boardId,
        voteCount,
        votes,
        userId,
        action: 'unvote',
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast vote.updated:`, err.message);
    }

    return {
      message: 'Vote berhasil dihapus',
      cardId,
      voteCount,
      votes,
    };
  }
}
