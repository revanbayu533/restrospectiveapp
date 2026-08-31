import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InviteService {
  constructor(private prisma: PrismaService) {}

  /**
   * Pengecekan apakah user memiliki akses admin/owner di workspace
   */
  private async checkAdminAccess(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace tidak ditemukan');
    }

    const member = workspace.members[0];
    const isOwner = workspace.ownerId === userId;
    const isAdmin = member && (member.role === 'owner' || member.role === 'admin');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Hanya admin/owner workspace yang memiliki akses ini');
    }

    return workspace;
  }

  /**
   * Membuat atau memperbarui link invite workspace (hanya admin/owner)
   */
  async createOrRegenerateInvite(workspaceId: string, userId: string) {
    await this.checkAdminAccess(workspaceId, userId);

    // Menonaktifkan semua link invite aktif sebelumnya untuk workspace ini
    await this.prisma.workspaceInvite.updateMany({
      where: { workspaceId, isActive: true },
      data: { isActive: false },
    });

    // Buat token unik dengan randomBytes
    const token = randomBytes(16).toString('hex');

    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        token,
        createdById: userId,
        isActive: true,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      message: 'Link invite berhasil dibuat',
      inviteToken: invite.token,
      invite: {
        id: invite.id,
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspace.name,
        token: invite.token,
        isActive: invite.isActive,
        createdAt: invite.createdAt,
      },
    };
  }

  /**
   * Menonaktifkan link invite workspace (hanya admin/owner)
   */
  async deactivateInvite(workspaceId: string, userId: string) {
    await this.checkAdminAccess(workspaceId, userId);

    await this.prisma.workspaceInvite.updateMany({
      where: { workspaceId, isActive: true },
      data: { isActive: false },
    });

    return {
      message: 'Link invite berhasil dinonaktifkan',
    };
  }

  /**
   * Mengambil link invite aktif workspace (hanya admin/owner)
   */
  async getActiveInvite(workspaceId: string, userId: string) {
    await this.checkAdminAccess(workspaceId, userId);

    const invite = await this.prisma.workspaceInvite.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return {
        message: 'Belum ada link invite aktif',
        invite: null,
      };
    }

    return {
      inviteToken: invite.token,
      invite: {
        id: invite.id,
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspace.name,
        token: invite.token,
        isActive: invite.isActive,
        createdAt: invite.createdAt,
      },
    };
  }

  /**
   * Mengambil detail preview invite berdasarkan token
   */
  async getInviteByToken(token: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite || !invite.isActive) {
      throw new NotFoundException('Link invite tidak valid atau sudah tidak aktif');
    }

    return {
      token: invite.token,
      workspace: invite.workspace,
      isActive: invite.isActive,
    };
  }

  /**
   * Join workspace menggunakan token invite (oleh user yang sudah terautentikasi)
   */
  async joinWorkspace(token: string, userId: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    });

    if (!invite || !invite.isActive) {
      throw new BadRequestException('Link invite tidak valid atau sudah tidak aktif');
    }

    // Cek apakah user sudah menjadi anggota workspace
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId,
        },
      },
    });

    if (existingMember) {
      return {
        message: 'Anda sudah menjadi anggota workspace ini',
        workspace: {
          id: invite.workspace.id,
          name: invite.workspace.name,
        },
      };
    }

    // Tambahkan user sebagai member
    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId,
        role: 'member',
      },
    });

    return {
      message: 'Berhasil bergabung ke workspace',
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
      },
    };
  }

  /**
   * Mengambil seluruh anggota workspace (hanya jika user adalah member workspace)
   */
  async getWorkspaceMembers(workspaceId: string, userId: string) {
    // Pengecekan keanggotaan
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Anda tidak memiliki akses ke workspace ini');
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
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
        joinedAt: 'asc',
      },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }
}
