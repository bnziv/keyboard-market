import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const trimEmpty = Transform(({ value }) => (value === '' ? undefined : value));

class BasePriceDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

class ItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class VendorDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class UpdateGroupBuyDto {
  @IsOptional()
  @trimEmpty
  @IsString()
  topicId?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  name?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  type?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  status?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  designer?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  overview?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  poster?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  gbStart?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  gbEnd?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  estimatedFulfillment?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePriceDto)
  basePrice?: BasePriceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorDto)
  vendors?: VendorDto[];

  @IsOptional()
  @trimEmpty
  @IsString()
  discordUrl?: string;

  @IsOptional()
  @trimEmpty
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedImages?: string[];

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
