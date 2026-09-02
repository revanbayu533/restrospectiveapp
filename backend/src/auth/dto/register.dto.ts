import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password harus mengandung kombinasi huruf dan angka',
  })
  password: string;

  @IsString({ message: 'Nama harus berupa string' })
  @IsOptional()
  name?: string;
}
