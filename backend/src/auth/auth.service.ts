import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.googleClient = new OAuth2Client(googleClientId);
  }

  /**
   * Registrasi User Baru
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    const cleanEmail = email.trim().toLowerCase();

    // Cek apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar. Silakan gunakan email lain.');
    }

    // Hashing password dengan bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    const user = await this.prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name ? name.trim() : null,
      },
    });

    // Generate JWT access token
    const token = await this.generateToken(user.id, user.email);
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Registrasi berhasil',
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  /**
   * Login User Manual (Email & Password)
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const cleanEmail = email.trim().toLowerCase();

    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Generate JWT access token
    const token = await this.generateToken(user.id, user.email);
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Login berhasil',
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  /**
   * Autentikasi Google OAuth 2.0 (Google Identity Services / One-Tap)
   */
  async googleAuth(googleLoginDto: GoogleLoginDto) {
    const { credential } = googleLoginDto;
    if (!credential) {
      throw new BadRequestException('Credential Google wajib disertakan');
    }

    const configuredClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    let googlePayload: any = null;

    try {
      // 1. Verifikasi ID Token secara kriptografis menggunakan Google Auth Library
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: configuredClientId || undefined,
      });
      googlePayload = ticket.getPayload();
    } catch (verifyErr) {
      // 2. Fallback verifikasi via Google TokenInfo API jika environment berbeda
      try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (res.ok) {
          googlePayload = await res.json();
        } else {
          throw new Error('Tokeninfo failed');
        }
      } catch {
        throw new UnauthorizedException('Token Google tidak valid atau telah kadaluarsa');
      }
    }

    if (!googlePayload || !googlePayload.email) {
      throw new UnauthorizedException('Gagal memverifikasi akun Google: Email tidak ditemukan');
    }

    // 3. Pastikan email terverifikasi oleh Google
    if (googlePayload.email_verified === false || googlePayload.email_verified === 'false') {
      throw new UnauthorizedException('Email Google belum terverifikasi oleh Google');
    }

    const email = googlePayload.email.toLowerCase().trim();
    const name = googlePayload.name || googlePayload.given_name || email.split('@')[0];

    // 4. Cari atau buat user di database
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generate secure random string untuk password hash akun Google
      const randomPassword = randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });
    } else if (!user.name && name) {
      // Update nama user jika sebelumnya kosong
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    // 5. Buat JWT Access Token aplikasi RetroNerve
    const token = await this.generateToken(user.id, user.email);
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Autentikasi Google berhasil',
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  /**
   * Logout User
   */
  async logout() {
    return {
      message: 'Logout berhasil. Silakan hapus token dari sisi client.',
    };
  }

  /**
   * Ambil Profil User Aktif (Me)
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Private Helper untuk Membuat Access Token JWT
   */
  private async generateToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }
}
