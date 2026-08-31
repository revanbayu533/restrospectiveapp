import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCardDto {
  @IsUUID('4', { message: 'columnId harus berupa format UUID yang valid' })
  @IsNotEmpty({ message: 'columnId wajib diisi' })
  columnId: string;

  @IsString({ message: 'content card harus berupa text' })
  @IsNotEmpty({ message: 'content card tidak boleh kosong' })
  content: string;
}
