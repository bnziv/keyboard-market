import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ImportGroupBuyDto } from './import-group-buy.dto';

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportGroupBuyDto)
  items: ImportGroupBuyDto[];
}
