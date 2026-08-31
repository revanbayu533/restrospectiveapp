import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

/**
 * Service Wrapper untuk Pusher Server SDK
 * Memungkinkan broadcast event realtime dan autentikasi private/presence channel
 */
@Injectable()
export class PusherService {
  private pusher: Pusher;

  constructor(private config: ConfigService) {
    this.pusher = new Pusher({
      appId: this.config.get<string>('PUSHER_APP_ID', ''),
      key: this.config.get<string>('PUSHER_KEY', ''),
      secret: this.config.get<string>('PUSHER_SECRET', ''),
      cluster: this.config.get<string>('PUSHER_CLUSTER', 'ap1'),
      useTLS: true,
    });
  }

  /**
   * Mengirim event realtime ke channel Pusher tertentu
   */
  async trigger(channel: string, event: string, data: any) {
    return this.pusher.trigger(channel, event, data);
  }

  /**
   * Mengotorisasi koneksi private / presence channel untuk client
   */
  authorizeChannel(socketId: string, channel: string, presenceData?: any) {
    return this.pusher.authorizeChannel(socketId, channel, presenceData);
  }
}
