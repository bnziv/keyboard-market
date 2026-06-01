import { OmitType } from '@nestjs/mapped-types';
import { UpdateGroupBuyDto } from './update-group-buy.dto';

export class ImportGroupBuyDto extends OmitType(UpdateGroupBuyDto, ['hidden'] as const) {}
