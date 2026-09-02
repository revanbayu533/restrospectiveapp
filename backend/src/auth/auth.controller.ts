import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registrasi Akun Baru (Dibatasi max 5 attempt / menit)
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login Manual (Dibatasi max 10 attempt / menit untuk proteksi brute-force)
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Login / Register dengan Google OAuth 2.0
   */
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleAuth(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleAuth(googleLoginDto);
  }

  /**
   * Logout User
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }

  /**
   * Profil User Aktif
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@GetUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
