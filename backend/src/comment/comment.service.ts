import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
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
   * Menambahkan Komentar pada Card
   */
  async createComment(userId: string, cardId: string, createCommentDto: CreateCommentDto) {
    const card = await this.checkCardAccess(userId, cardId);

    // 1. Simpan Komentar ke Database
    const comment = await this.prisma.comment.create({
      data: {
        cardId,
        userId,
        content: createCommentDto.content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 2. Hitung jumlah total komentar pada card
    const commentsCount = await this.prisma.comment.count({
      where: { cardId },
    });

    const formattedComment = {
      id: comment.id,
      cardId: comment.cardId,
      content: comment.content,
      createdAt: comment.createdAt,
      authorId: comment.userId,
      author: comment.user,
      authorName: comment.user.name || comment.user.email,
    };

    // 3. Trigger Realtime Broadcast via Pusher
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'comment.created', {
        cardId,
        boardId: card.boardId,
        comment: formattedComment,
        commentsCount,
        authorName: formattedComment.authorName,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast comment.created:`, err.message);
    }

    return {
      message: 'Komentar berhasil ditambahkan',
      comment: formattedComment,
      commentsCount,
    };
  }

  /**
   * Mengambil Seluruh Komentar pada Suatu Card
   */
  async getCardComments(userId: string, cardId: string) {
    await this.checkCardAccess(userId, cardId);

    const comments = await this.prisma.comment.findMany({
      where: { cardId },
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
        createdAt: 'asc',
      },
    });

    return comments.map((c) => ({
      id: c.id,
      cardId: c.cardId,
      content: c.content,
      createdAt: c.createdAt,
      authorId: c.userId,
      author: c.user,
      authorName: c.user.name || c.user.email,
    }));
  }

  /**
   * Menghapus Komentar (Hanya Pembuat Komentar)
   */
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        card: {
          select: {
            id: true,
            boardId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Komentar tidak ditemukan');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Anda hanya dapat menghapus komentar milik Anda sendiri');
    }

    const cardId = comment.cardId;
    const boardId = comment.card.boardId;

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    const commentsCount = await this.prisma.comment.count({
      where: { cardId },
    });

    // Broadcast realtime Pusher event
    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    try {
      await this.pusher.trigger(channels, 'comment.deleted', {
        cardId,
        boardId,
        commentId,
        commentsCount,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast comment.deleted:`, err.message);
    }

    return {
      message: 'Komentar berhasil dihapus',
      cardId,
      commentId,
      commentsCount,
    };
  }
}
