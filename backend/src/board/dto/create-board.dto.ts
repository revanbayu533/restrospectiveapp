import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBoardDto {
  @IsString({ message: 'Nama board harus berupa string' })
  @IsNotEmpty({ message: 'Nama board wajib diisi' })
  name: string;

  @IsString({ message: 'Template harus berupa string' })
  @IsOptional()
  template?: string;

  @IsArray({ message: 'customColumns harus berupa array' })
  @IsString({ each: true, message: 'Setiap nama kolom custom harus berupa string' })
  @IsOptional()
  customColumns?: string[];

  @IsBoolean({ message: 'isAnonymous harus berupa boolean' })
  @IsOptional()
  isAnonymous?: boolean;

  @IsInt({ message: 'voteLimit harus berupa angka' })
  @Min(0, { message: 'voteLimit tidak boleh negatif' })
  @IsOptional()
  voteLimit?: number;
}
