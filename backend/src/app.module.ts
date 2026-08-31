import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
    // Modul Retrospective Board
    BoardModule,
    // Modul Card / Sticky Notes
    CardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
