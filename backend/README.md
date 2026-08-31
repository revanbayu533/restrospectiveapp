# Retrospective App - Backend (NestJS)

Dokumentasi fondasi backend Restrospective App berbasis NestJS, Prisma ORM, JWT Authentication, dan Pusher Realtime Service.

## 🚀 Fitur Utama & Modul

- **NestJS Framework**: Struktur aplikasi scalable dengan TypeScript.
- **Prisma ORM**: Pengelolaan database (PostgreSQL / MySQL) yang type-safe (`PrismaService` & `PrismaModule`).
- **Config & Validation**: Menggunakan `@nestjs/config` untuk `.env` dan `class-validator` + `class-transformer` untuk DTO validation pipe global.
- **JWT Authentication**: Dikonfigurasi secara global melalui `@nestjs/jwt`.
- **Pusher Service**: Modul `PusherModule` & `PusherService` sebagai wrapper realtime broadcast (`pusher.trigger()`).

---

## 🛠️ Persyaratan System

- Node.js >= 18.x
- npm >= 9.x
- Database PostgreSQL / MySQL

---

## ⚙️ Variabel Lingkungan (`.env`)

Buat file `.env` di folder `backend/` dengan mengacu pada `.env.example`:

```env
# Port Server
PORT=3000

# Database Connection (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/retrospective_db?schema=public"

# Auth JWT
JWT_SECRET="retrospective_jwt_secret_dev_key"
JWT_EXPIRES_IN="1d"

# Pusher Credentials
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="ap1"
```

---

## 📦 Instalasi & Pengoperasian

### 1. Install Dependensi
```bash
npm install
```

### 2. Generasi Client Prisma
```bash
npx prisma generate
```

### 3. Migrasi Database (Opsional saat lokal DB aktif)
```bash
npx prisma migrate dev --name init
```

### 4. Jalankan Server Dev Mode
```bash
npm run start:dev
```

### 5. Build Produksi
```bash
npm run build
npm run start:prod
```

---

## 📡 Menggunakan Pusher Realtime Service

Inject `PusherService` ke dalam service lain untuk menyiarkan event:

```typescript
import { Injectable } from '@nestjs/common';
import { PusherService } from './pusher/pusher.service';

@Injectable()
export class BoardService {
  constructor(private pusherService: PusherService) {}

  async notifyNewCard(boardId: string, cardData: any) {
    await this.pusherService.trigger(`board-${boardId}`, 'card-added', cardData);
  }
}
```

---

## 📁 Struktur Folder

```
backend/
├── prisma/
│   └── schema.prisma         # Schema Prisma ORM
├── src/
│   ├── prisma/               # Service & Module Prisma global
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── pusher/               # Service & Module Pusher realtime
│   │   ├── pusher.module.ts
│   │   └── pusher.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts         # Module utama aplikasi
│   ├── app.service.ts
│   └── main.ts               # Entrypoint NestJS & Global Pipes
├── .env                      # Variabel lingkungan lokal
├── .env.example              # Template variabel lingkungan
└── README.md
```
