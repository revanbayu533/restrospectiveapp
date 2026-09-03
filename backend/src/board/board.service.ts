import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { getAllTemplates, getTemplateColumns } from './constants/retro-templates';
import { CreateBoardDto } from './dto/create-board.dto';

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
    await this.checkWorkspaceMembership(userId, board.workspaceId);

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
}
