import { Controller, Get, Query } from '@nestjs/common';
import { GroupBuysService } from './group-buys.service';

@Controller('groupbuys')
export class GroupBuysController {
  constructor(private readonly groupBuysService: GroupBuysService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.groupBuysService.findAll(status);
  }
}
