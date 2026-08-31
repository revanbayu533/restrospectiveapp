import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString({ message: 'Nama workspace harus berupa text' })
  @IsNotEmpty({ message: 'Nama workspace wajib diisi' })
  name: string;
}
