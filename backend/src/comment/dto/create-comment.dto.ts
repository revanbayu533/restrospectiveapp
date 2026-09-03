import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Isi komentar tidak boleh kosong' })
  @IsString({ message: 'Isi komentar harus berupa teks' })
  @MaxLength(1000, { message: 'Komentar maksimal 1000 karakter' })
  content: string;
}
