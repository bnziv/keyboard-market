import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ListingFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  offers?: boolean;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdOn';

  @IsOptional()
  @IsString()
  sortDirection?: string = 'desc';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  size?: number = 12;
}
