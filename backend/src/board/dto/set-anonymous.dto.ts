import { IsBoolean } from 'class-validator';

export class SetAnonymousDto {
  @IsBoolean({ message: 'isAnonymous harus berupa boolean' })
  isAnonymous: boolean;
}
