import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { StartTimerDto, UpdateDurationDto } from './dto/timer.dto';

@Injectable()
export class TimerService {
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
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        timer: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const member = board.workspace.members[0];
    if (!member) {
      throw new ForbiddenException('Anda tidak memiliki akses ke board ini');
    }

    return {
      board,
      user: member.user,
      timer: board.timer,
    };
  }

  /**
   * Mengambil atau membuat default timer untuk suatu Board
   */
  private async getOrCreateTimer(boardId: string, existingTimer?: any) {
    if (existingTimer) return existingTimer;

    let timer = await this.prisma.boardTimer.findUnique({
      where: { boardId },
    });

    if (!timer) {
      timer = await this.prisma.boardTimer.create({
        data: {
          boardId,
          duration: 300, // 5 menit default
          remaining: 300,
          isRunning: false,
        },
      });
    }

    return timer;
  }

  /**
   * Menghitung sisa detik timer secara akurat berdasarkan startedAt
   */
  private computeActiveTimerState(timer: any) {
    const now = Date.now();
    let remaining = timer.remaining;
    let isRunning = timer.isRunning;
    let endsAt: number | null = null;

    if (isRunning && timer.startedAt) {
      const startTime = new Date(timer.startedAt).getTime();
      endsAt = startTime + timer.remaining * 1000;
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      remaining = Math.max(0, timer.remaining - elapsedSeconds);
      if (remaining === 0) {
        isRunning = false;
      }
    }

    return {
      id: timer.id,
      boardId: timer.boardId,
      duration: timer.duration,
      remaining,
      isRunning,
      startedAt: timer.startedAt,
      pausedAt: timer.pausedAt,
      endsAt,
      serverTime: now,
      timestamp: now,
    };
  }

  /**
   * Mengambil Status Timer Aktif
   */
  async getTimer(userId: string, boardId: string) {
    const { timer } = await this.checkBoardAccess(userId, boardId);
    const activeTimer = await this.getOrCreateTimer(boardId, timer);
    return this.computeActiveTimerState(activeTimer);
  }

  /**
   * Memulai / Melanjutkan Timer (Start / Resume)
   */
  async startTimer(userId: string, boardId: string, startTimerDto?: StartTimerDto) {
    const { user, timer } = await this.checkBoardAccess(userId, boardId);
    const existingTimer = await this.getOrCreateTimer(boardId, timer);
    const currentState = this.computeActiveTimerState(existingTimer);

    const now = new Date();
    let targetDuration = existingTimer.duration;
    let targetRemaining = currentState.remaining;

    if (startTimerDto?.duration && startTimerDto.duration > 0) {
      targetDuration = startTimerDto.duration;
      targetRemaining = startTimerDto.duration;
    } else if (targetRemaining <= 0) {
      targetRemaining = targetDuration;
    }

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { boardId },
      data: {
        duration: targetDuration,
        remaining: targetRemaining,
        isRunning: true,
        startedAt: now,
        pausedAt: null,
      },
    });

    const state = this.computeActiveTimerState(updatedTimer);

    const payload = {
      ...state,
      action: 'start',
      userId,
      userName: user?.name || 'Anggota',
      timestamp: Date.now(),
    };

    // Broadcast realtime event non-blocking for lowest latency
    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    this.pusher.trigger(channels, 'timer.updated', payload).catch((err) => {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast timer.updated:`, err.message);
    });

    return payload;
  }

  /**
   * Menghentikan Sementara Timer (Pause)
   */
  async pauseTimer(userId: string, boardId: string) {
    const { user, timer } = await this.checkBoardAccess(userId, boardId);
    const existingTimer = await this.getOrCreateTimer(boardId, timer);

    const currentState = this.computeActiveTimerState(existingTimer);
    const now = new Date();

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { boardId },
      data: {
        remaining: currentState.remaining,
        isRunning: false,
        startedAt: null,
        pausedAt: now,
      },
    });

    const state = this.computeActiveTimerState(updatedTimer);

    const payload = {
      ...state,
      action: 'pause',
      userId,
      userName: user?.name || 'Anggota',
      timestamp: Date.now(),
    };

    // Broadcast realtime event non-blocking for lowest latency
    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    this.pusher.trigger(channels, 'timer.updated', payload).catch((err) => {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast timer.updated:`, err.message);
    });

    return payload;
  }

  /**
   * Mereset Timer ke Durasi Awal
   */
  async resetTimer(userId: string, boardId: string) {
    const { user, timer } = await this.checkBoardAccess(userId, boardId);
    const existingTimer = await this.getOrCreateTimer(boardId, timer);

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { boardId },
      data: {
        remaining: existingTimer.duration,
        isRunning: false,
        startedAt: null,
        pausedAt: null,
      },
    });

    const state = this.computeActiveTimerState(updatedTimer);

    const payload = {
      ...state,
      action: 'reset',
      userId,
      userName: user?.name || 'Anggota',
      timestamp: Date.now(),
    };

    // Broadcast realtime event non-blocking for lowest latency
    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    this.pusher.trigger(channels, 'timer.updated', payload).catch((err) => {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast timer.updated:`, err.message);
    });

    return payload;
  }

  /**
   * Mengubah Durasi Timer
   */
  async updateDuration(userId: string, boardId: string, updateDurationDto: UpdateDurationDto) {
    const { user } = await this.checkBoardAccess(userId, boardId);
    const { duration } = updateDurationDto;

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { boardId },
      data: {
        duration,
        remaining: duration,
        isRunning: false,
        startedAt: null,
        pausedAt: null,
      },
    });

    const state = this.computeActiveTimerState(updatedTimer);

    const payload = {
      ...state,
      action: 'update',
      userId,
      userName: user?.name || 'Anggota',
      timestamp: Date.now(),
    };

    // Broadcast realtime event non-blocking for lowest latency
    const channels = [`private-board-${boardId}`, `board-${boardId}`];
    this.pusher.trigger(channels, 'timer.updated', payload).catch((err) => {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast timer.updated:`, err.message);
    });

    return payload;
  }
}
