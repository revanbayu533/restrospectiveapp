import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspaceService } from './workspace.service';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async createWorkspace(
    @GetUser('id') userId: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(userId, createWorkspaceDto);
  }

  @Get()
  async getUserWorkspaces(@GetUser('id') userId: string) {
    return this.workspaceService.getUserWorkspaces(userId);
  }

  @Get(':id')
  async getWorkspaceById(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.workspaceService.getWorkspaceById(userId, workspaceId);
  }

  @Patch(':id')
  async updateWorkspace(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.workspaceService.updateWorkspace(userId, workspaceId, body);
  }

  @Delete(':id')
  async deleteWorkspace(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.workspaceService.deleteWorkspace(userId, workspaceId);
  }
}
