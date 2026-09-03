import { IsOptional, IsString } from 'class-validator';

export class GroupCardDto {
  @IsOptional()
  @IsString()
  groupId?: string | null;

  @IsOptional()
  @IsString()
  targetCardId?: string;

  @IsOptional()
  @IsString()
  groupTitle?: string | null;
}

export class MoveCardDto {
  @IsString()
  columnId: string;
}

export class UpdateGroupTitleDto {
  @IsString()
  groupTitle: string;
}

export class MoveGroupDto {
  @IsString()
  columnId: string;
}
