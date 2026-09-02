import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsString({ message: 'Google credential / token harus berupa string' })
  @IsNotEmpty({ message: 'Google credential / token tidak boleh kosong' })
  credential: string;
}
