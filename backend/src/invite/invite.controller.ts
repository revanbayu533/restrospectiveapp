import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteService } from './invite.service';

@Controller()
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  /**
   * POST /api/workspaces/:id/invite
   * Buat atau buat ulang (regenerate) link invite workspace (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post('workspaces/:id/invite')
  async createInvite(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.inviteService.createOrRegenerateInvite(workspaceId, userId);
  }

  /**
   * GET /api/workspaces/:id/invite
   * Ambil detail link invite aktif (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Get('workspaces/:id/invite')
  async getActiveInvite(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.inviteService.getActiveInvite(workspaceId, userId);
  }

  /**
   * PATCH /api/workspaces/:id/invite/deactivate
   * Menonaktifkan link invite workspace (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('workspaces/:id/invite/deactivate')
  async deactivateInvite(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.inviteService.deactivateInvite(workspaceId, userId);
  }

  /**
   * GET /api/workspaces/:id/members
   * Melihat anggota workspace (Workspace members only)
   */
  @UseGuards(JwtAuthGuard)
  @Get('workspaces/:id/members')
  async getWorkspaceMembers(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.inviteService.getWorkspaceMembers(workspaceId, userId);
  }

  /**
   * GET /api/invites/:token
   * Public preview detail workspace berdasarkan token invite
   */
  @Get('invites/:token')
  async getInviteInfo(@Param('token') token: string) {
    return this.inviteService.getInviteByToken(token);
  }

  /**
   * POST /api/invites/:token/join
   * Join workspace setelah login/register (Protected)
   */
  @UseGuards(JwtAuthGuard)
  @Post('invites/:token/join')
  async joinWorkspace(
    @GetUser('id') userId: string,
    @Param('token') token: string,
  ) {
    return this.inviteService.joinWorkspace(token, userId);
  }
}
