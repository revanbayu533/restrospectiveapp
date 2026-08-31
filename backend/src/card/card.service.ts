import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  /**
   * Pengecekan Otorisasi Keanggotaan Workspace Berdasarkan Board ID
   */
  private async checkBoardAccess(userId: string, boardId: string) {
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
      throw new NotFoundException('Board tidak ditemukan');
    }

    const isMember = board.workspace.members.length > 0;
    if (!isMember) {
      throw new ForbiddenException('Anda tidak memiliki akses ke board workspace ini');
    }

    return board;
  }

  /**
   * Menambahkan Card Baru Ke Dalam Kolom Board
   */
  async createCard(userId: string, boardId: string, createCardDto: CreateCardDto) {
    const { columnId, content } = createCardDto;

    // 1. Cek Otorisasi Akses User ke Board
    const board = await this.checkBoardAccess(userId, boardId);

    // 2. Pastikan kolom yang dituju benar-benar milik board ini
    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        boardId: board.id,
      },
    });

    if (!column) {
      throw new NotFoundException('Kolom tidak ditemukan di dalam board ini');
    }

    // 3. Simpan Card ke Database
    const card = await this.prisma.card.create({
      data: {
        boardId: board.id,
        columnId: column.id,
        authorId: userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 4. Trigger Realtime Broadcast via Pusher
    const channelName = `board-${boardId}`;
    try {
      await this.pusher.trigger(channelName, 'card.created', card);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.created ke channel ${channelName}:`, err.message);
    }

    return {
      message: 'Card berhasil dibuat',
      card,
    };
  }

  /**
   * Mengambil Semua Card Pada Suatu Board
   */
  async getBoardCards(userId: string, boardId: string) {
    // 1. Cek Otorisasi Akses User ke Board
    await this.checkBoardAccess(userId, boardId);

    // 2. Ambil semua card diurutkan berdasarkan tanggal dibuat
    const cards = await this.prisma.card.findMany({
      where: { boardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return cards;
  }

  /**
   * Mengubah Isi Card (Hanya Pembuat/Author Card)
   */
  async updateCard(userId: string, cardId: string, updateCardDto: UpdateCardDto) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Ownership Check: Memastikan user adalah author dari card ini
    if (card.authorId !== userId) {
      throw new ForbiddenException('Anda hanya dapat mengubah card milik Anda sendiri');
    }

    // 3. Update Card di Database
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        content: updateCardDto.content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 4. Trigger Realtime Broadcast via Pusher
    const channelName = `board-${card.boardId}`;
    try {
      await this.pusher.trigger(channelName, 'card.updated', updatedCard);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.updated ke channel ${channelName}:`, err.message);
    }

    return {
      message: 'Card berhasil diperbarui',
      card: updatedCard,
    };
  }

  /**
   * Menghapus Card (Hanya Pembuat/Author Card)
   */
  async deleteCard(userId: string, cardId: string) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Ownership Check: Memastikan user adalah author dari card ini
    if (card.authorId !== userId) {
      throw new ForbiddenException('Anda hanya dapat menghapus card milik Anda sendiri');
    }

    // 3. Hapus Card dari Database
    await this.prisma.card.delete({
      where: { id: cardId },
    });

    // 4. Trigger Realtime Broadcast via Pusher
    const channelName = `board-${card.boardId}`;
    try {
      await this.pusher.trigger(channelName, 'card.deleted', {
        id: card.id,
        boardId: card.boardId,
        columnId: card.columnId,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.deleted ke channel ${channelName}:`, err.message);
    }

    return {
      message: 'Card berhasil dihapus',
    };
  }
}
