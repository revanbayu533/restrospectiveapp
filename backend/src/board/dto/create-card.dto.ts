import { IsString } from 'class-validator';

export class CreateCardDto {
  @IsString()
  columnId: string;

  @IsString()
  content: string;
}
