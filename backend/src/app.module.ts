import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BoardModule } from './board/board.module';
import { CardModule } from './card/card.module';
import { InviteModule } from './invite/invite.module';
import { PrismaModule } from './prisma/prisma.module';
import { PusherModule } from './pusher/pusher.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    // Konfigurasi Global Environment Variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate Limiting & Anti-Brute Force Protection
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 detik
        limit: 60, // 60 request per menit
      },
    ]),
    // Konfigurasi Global JWT Module
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'retrospective_jwt_secret_dev_key'),
        signOptions: {
          expiresIn: configService.get<any>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
    // Modul Prisma untuk akses Database
    PrismaModule,
    // Modul Pusher untuk Realtime Broadcast
    PusherModule,
    // Modul Autentikasi User
    AuthModule,
    // Modul Manajemen Workspace
    WorkspaceModule,
    // Modul Board & Card Retrospective
    BoardModule,
    // Modul Invite Workspace
    InviteModule,
    // Modul Card / Sticky Notes
    CardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
