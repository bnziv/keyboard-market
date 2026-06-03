import { IsBoolean, IsOptional } from 'class-validator';

export class SetFlagsDto {
  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
