import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

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
  @IsString()
  topic_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  designer?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsString()
  gb_start?: string;

  @IsOptional()
  @IsString()
  gb_end?: string;

  @IsOptional()
  @IsString()
  estimated_fulfillment?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BasePriceDto)
  base_price?: BasePriceDto;

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
  @IsString()
  discord_url?: string;

  @IsOptional()
  @IsString()
  source_url?: string;

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
}
