import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateCardDto } from './dto/create-card.dto';
import { GroupCardDto } from './dto/group-card.dto';
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
   * Helper default include untuk Card
   */
  private cardIncludeOptions() {
    return {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      votes: {
        select: {
          id: true,
          userId: true,
          createdAt: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    };
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
      include: this.cardIncludeOptions(),
    });

    // 4. Trigger Realtime Broadcast via Pusher (ke public & private channel)
    const broadcastCard = board.isAnonymous
      ? {
          ...card,
          author: {
            id: card.authorId,
            name: 'Anonymous',
            email: '',
          },
        }
      : card;

    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    try {
      await this.pusher.trigger(channels, 'card.created', broadcastCard);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.created:`, err.message);
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
    const board = await this.checkBoardAccess(userId, boardId);
    const member = board.workspace.members[0];
    const isOwnerOrFacilitator = board.workspace.ownerId === userId || member?.role === 'owner';

    // 2. Ambil semua card diurutkan berdasarkan tanggal dibuat
    const cards = await this.prisma.card.findMany({
      where: { boardId },
      include: this.cardIncludeOptions(),
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (board.isAnonymous && !isOwnerOrFacilitator) {
      return cards.map((c) => ({
        ...c,
        author: c.authorId === userId ? c.author : { id: 'anonymous', name: 'Anonymous', email: '' },
      }));
    }

    return cards;
  }

  /**
   * Mengubah Isi Card (Hanya Pembuat/Author Card)
   */
  async updateCard(userId: string, cardId: string, updateCardDto: UpdateCardDto) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: this.cardIncludeOptions(),
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
      include: this.cardIncludeOptions(),
    });

    const board = await this.prisma.board.findUnique({ where: { id: card.boardId } });
    const broadcastCard = board?.isAnonymous
      ? {
          ...updatedCard,
          author: {
            id: updatedCard.authorId,
            name: 'Anonymous',
            email: '',
          },
        }
      : updatedCard;

    // 4. Trigger Realtime Broadcast via Pusher (ke public & private channel)
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'card.updated', broadcastCard);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.updated:`, err.message);
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

    // 4. Trigger Realtime Broadcast via Pusher (ke public & private channel)
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'card.deleted', {
        id: card.id,
        boardId: card.boardId,
        columnId: card.columnId,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.deleted:`, err.message);
    }

    return {
      message: 'Card berhasil dihapus',
    };
  }

  /**
   * Grouping / Clustering Card (Card 10)
   * Menggabungkan atau memisahkan (ungroup) card ke dalam cluster
   */
  async groupCard(userId: string, cardId: string, groupCardDto: GroupCardDto) {
    const { groupId, targetCardId } = groupCardDto;

    // 1. Cari source card
    const sourceCard = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!sourceCard) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Validasi akses board
    await this.checkBoardAccess(userId, sourceCard.boardId);

    let assignedGroupId: string | null = null;
    let targetCardUpdated: any = null;

    if (targetCardId) {
      if (targetCardId === cardId) {
        throw new BadRequestException('Tidak dapat mengelompokkan card ke dirinya sendiri');
      }

      const targetCard = await this.prisma.card.findUnique({
        where: { id: targetCardId },
      });

      if (!targetCard) {
        throw new NotFoundException('Target card tidak ditemukan');
      }

      if (targetCard.boardId !== sourceCard.boardId) {
        throw new BadRequestException('Card harus berada pada board yang sama');
      }

      // Jika target card sudah memiliki groupId, gunakan groupId tsb. Jika belum, buat groupId baru
      assignedGroupId = targetCard.groupId || `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Jika targetCard belum memiliki groupId, perbarui targetCard juga
      if (!targetCard.groupId) {
        targetCardUpdated = await this.prisma.card.update({
          where: { id: targetCardId },
          data: {
            groupId: assignedGroupId,
            groupTitle: targetCard.groupTitle || groupCardDto.groupTitle || null,
          },
          include: this.cardIncludeOptions(),
        });
      }
    } else if (groupId !== undefined) {
      assignedGroupId = groupId;
    }

    // 3. Update source card
    const updatedSourceCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        groupId: assignedGroupId,
        groupTitle: assignedGroupId ? (groupCardDto.groupTitle || targetCardUpdated?.groupTitle || sourceCard.groupTitle) : null,
      },
      include: this.cardIncludeOptions(),
    });

    // 4. Broadcast realtime event Pusher ke channel board
    const channels = [`private-board-${sourceCard.boardId}`, `board-${sourceCard.boardId}`];
    try {
      await this.pusher.trigger(channels, 'card.grouped', {
        cardId: updatedSourceCard.id,
        groupId: updatedSourceCard.groupId,
        groupTitle: updatedSourceCard.groupTitle,
        card: updatedSourceCard,
        boardId: sourceCard.boardId,
        targetCard: targetCardUpdated,
      });

      await this.pusher.trigger(channels, 'card.updated', updatedSourceCard);
      if (targetCardUpdated) {
        await this.pusher.trigger(channels, 'card.updated', targetCardUpdated);
      }
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.grouped:`, err.message);
    }

    return {
      message: assignedGroupId ? 'Card berhasil digabungkan ke dalam grup' : 'Card berhasil dikeluarkan dari grup',
      card: updatedSourceCard,
      targetCard: targetCardUpdated,
    };
  }

  /**
   * Mengubah Judul Topik Group / Cluster
   */
  async updateGroupTitle(userId: string, groupId: string, updateGroupTitleDto: { groupTitle: string }) {
    const cardsInGroup = await this.prisma.card.findMany({
      where: { groupId },
    });

    if (cardsInGroup.length === 0) {
      throw new NotFoundException('Grup tidak ditemukan');
    }

    const boardId = cardsInGroup[0].boardId;
    await this.checkBoardAccess(userId, boardId);

    const title = updateGroupTitleDto.groupTitle?.trim() || null;

    await this.prisma.card.updateMany({
      where: { groupId },
      data: { groupTitle: title },
    });

    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    try {
      await this.pusher.trigger(channels, 'group.title_updated', {
        groupId,
        groupTitle: title,
        boardId,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast group.title_updated:`, err.message);
    }

    return {
      message: 'Judul grup berhasil diperbarui',
      groupId,
      groupTitle: title,
    };
  }

  /**
   * Memindahkan Card Individual ke Kolom Lain (Cross-Column Move)
   */
  async moveCard(userId: string, cardId: string, moveCardDto: { columnId: string }) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    await this.checkBoardAccess(userId, card.boardId);

    // Validasi target column
    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: moveCardDto.columnId,
        boardId: card.boardId,
      },
    });

    if (!column) {
      throw new NotFoundException('Kolom target tidak ditemukan di dalam board ini');
    }

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        columnId: column.id,
      },
      include: this.cardIncludeOptions(),
    });

    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'card.moved', {
        cardId: updatedCard.id,
        columnId: updatedCard.columnId,
        boardId: card.boardId,
        card: updatedCard,
      });
      await this.pusher.trigger(channels, 'card.updated', updatedCard);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast card.moved:`, err.message);
    }

    return {
      message: 'Card berhasil dipindahkan ke kolom baru',
      card: updatedCard,
    };
  }

  /**
   * Memindahkan Seluruh Group Cluster ke Kolom Lain
   */
  async moveGroup(userId: string, groupId: string, moveGroupDto: { columnId: string }) {
    const cardsInGroup = await this.prisma.card.findMany({
      where: { groupId },
    });

    if (cardsInGroup.length === 0) {
      throw new NotFoundException('Grup tidak ditemukan');
    }

    const boardId = cardsInGroup[0].boardId;
    await this.checkBoardAccess(userId, boardId);

    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: moveGroupDto.columnId,
        boardId,
      },
    });

    if (!column) {
      throw new NotFoundException('Kolom target tidak ditemukan');
    }

    await this.prisma.card.updateMany({
      where: { groupId },
      data: {
        columnId: column.id,
      },
    });

    const updatedCards = await this.prisma.card.findMany({
      where: { groupId },
      include: this.cardIncludeOptions(),
    });

    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    try {
      await this.pusher.trigger(channels, 'group.moved', {
        groupId,
        columnId: column.id,
        boardId,
        cards: updatedCards,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast group.moved:`, err.message);
    }

    return {
      message: 'Seluruh grup berhasil dipindahkan ke kolom baru',
      groupId,
      columnId: column.id,
      cards: updatedCards,
    };
  }
}
