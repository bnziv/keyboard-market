import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { UpdateGroupBuyDto } from './update-group-buy.dto';

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGroupBuyDto)
  items: UpdateGroupBuyDto[];
}
