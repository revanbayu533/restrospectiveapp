import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { getAllTemplates, getTemplateColumns } from './constants/retro-templates';
import { CreateBoardDto } from './dto/create-board.dto';
import { SetAnonymousDto } from './dto/set-anonymous.dto';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  /**
   * Mengambil Semua Template Retrospective yang Tersedia
   */
  getTemplates() {
    return getAllTemplates();
  }

  /**
   * Pengecekan Keanggotaan User di Workspace
   */
  private async checkWorkspaceMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Anda bukan anggota dari workspace ini');
    }

    return membership;
  }

  /**
   * Membuat Board Baru dalam Workspace Berdasarkan Template / Kolom Kustom
   */
  async createBoard(userId: string, workspaceId: string, createBoardDto: CreateBoardDto) {
    // 1. Pastikan user adalah anggota workspace
    await this.checkWorkspaceMembership(userId, workspaceId);

    const { name, template = 'start-stop-continue', customColumns, isAnonymous = false, voteLimit } = createBoardDto;

    // 2. Tentukan struktur kolom (Kustom dari user ATAU dari Template)
    let columnsToCreate: { name: string; order: number }[] = [];

    if (customColumns && Array.isArray(customColumns) && customColumns.length > 0) {
      columnsToCreate = customColumns.map((colName, idx) => ({
        name: colName.trim(),
        order: idx + 1,
      }));
    } else {
      columnsToCreate = getTemplateColumns(template).map((col) => ({
        name: col.name,
        order: col.order,
      }));
    }

    // 3. Buat Board dan Kolom-Kolom
    const board = await this.prisma.board.create({
      data: {
        name,
        workspaceId,
        template,
        isAnonymous,
        voteLimit,
        columns: {
          create: columnsToCreate,
        },
      },
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
        },
        cards: true,
      },
    });

    // 4. Realtime Broadcast via Pusher
    try {
      await this.pusher.trigger(`workspace-${workspaceId}`, 'board:created', { board });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim event board:created:`, err.message);
    }

    return {
      message: 'Board berhasil dibuat',
      board,
    };
  }

  /**
   * Mengambil Semua Board di Workspace Tertentu
   */
  async getWorkspaceBoards(userId: string, workspaceId: string) {
    // 1. Pastikan user adalah anggota workspace
    await this.checkWorkspaceMembership(userId, workspaceId);

    // 2. Ambil daftar board
    const boards = await this.prisma.board.findMany({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return boards.map((b) => ({
      id: b.id,
      name: b.name,
      template: b.template,
      isAnonymous: b.isAnonymous,
      voteLimit: b.voteLimit,
      workspaceId: b.workspaceId,
      columns: b.columns,
      cardsCount: b._count.cards,
      createdAt: b.createdAt,
    }));
  }

  /**
   * Alias untuk getWorkspaceBoards jika dipanggil oleh controller lain
   */
  async getBoardsByWorkspace(userId: string, workspaceId: string) {
    return this.getWorkspaceBoards(userId, workspaceId);
  }

  /**
   * Mengambil Detail Board Berdasarkan ID
   */
  async getBoardById(userId: string, boardId: string) {
    // 1. Cari Board
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
          include: {
            cards: {
              include: {
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
                _count: {
                  select: {
                    votes: true,
                    comments: true,
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
                    createdAt: 'asc',
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        timer: true,
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    // 2. Cek apakah user adalah anggota dari workspace tempat board berada
    const membership = await this.checkWorkspaceMembership(userId, board.workspaceId);
    const isOwnerOrFacilitator = board.workspace.ownerId === userId || membership?.role === 'owner';

    // 3. Sanitasi author cards jika anonymous mode aktif untuk non-facilitator
    if (board.isAnonymous && !isOwnerOrFacilitator && Array.isArray(board.columns)) {
      board.columns = board.columns.map((col: any) => ({
        ...col,
        cards: Array.isArray(col.cards)
          ? col.cards.map((card: any) => ({
              ...card,
              author: card.authorId === userId ? card.author : { id: 'anonymous', name: 'Anonymous', email: '' },
            }))
          : [],
      }));
    }

    return board;
  }

  /**
   * Menghapus Board (Hanya Owner Workspace)
   */
  async deleteBoard(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { workspace: true },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const isOwner = board.workspace.ownerId === userId;
    if (!isOwner) {
      throw new ForbiddenException('Hanya owner workspace yang dapat menghapus board');
    }

    await this.prisma.$transaction([
      this.prisma.card.deleteMany({ where: { boardId } }),
      this.prisma.boardColumn.deleteMany({ where: { boardId } }),
      this.prisma.board.delete({ where: { id: boardId } }),
    ]);

    try {
      await this.pusher.trigger(`workspace-${board.workspaceId}`, 'board:deleted', { boardId });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim event board:deleted:`, err.message);
    }

    return { message: 'Board berhasil dihapus' };
  }

  /**
   * Mengubah Anonymous Mode pada Board (Hanya Facilitator / Workspace Owner)
   */
  async setAnonymous(userId: string, boardId: string, setAnonymousDto: SetAnonymousDto) {
    const { isAnonymous } = setAnonymousDto;

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const member = board.workspace.members[0];
    if (!member) {
      throw new ForbiddenException('Anda tidak memiliki akses ke board ini');
    }

    const isOwner = board.workspace.ownerId === userId || member.role === 'owner';
    if (!isOwner) {
      throw new ForbiddenException('Hanya facilitator/owner yang dapat mengubah anonymous mode');
    }

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: { isAnonymous },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        template: true,
        isAnonymous: true,
        voteLimit: true,
      },
    });

    // Broadcast Pusher realtime event
    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    const payload = {
      boardId,
      isAnonymous,
      updatedBy: {
        id: member.user.id,
        name: member.user.name,
      },
      timestamp: Date.now(),
    };

    try {
      await this.pusher.trigger(channels, 'board.anonymous.updated', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast board.anonymous.updated:`, err.message);
    }

    return {
      message: isAnonymous ? 'Mode anonim berhasil diaktifkan' : 'Mode anonim berhasil dinonaktifkan',
      board: updatedBoard,
    };
  }
}

