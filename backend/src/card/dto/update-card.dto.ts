import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCardDto {
  @IsString({ message: 'content card harus berupa text' })
  @IsNotEmpty({ message: 'content card tidak boleh kosong' })
  content: string;
}
