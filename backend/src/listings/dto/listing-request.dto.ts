import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListingRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  offers?: boolean;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
