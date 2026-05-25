import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { GroupBuysService } from './group-buys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateGroupBuyDto } from './dto/update-group-buy.dto';

@Controller('groupbuys')
export class GroupBuysController {
  constructor(private readonly groupBuysService: GroupBuysService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.groupBuysService.findAll(status);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin(@Query('status') status?: string) {
    return this.groupBuysService.findAllAdmin(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.groupBuysService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGroupBuyDto) {
    return this.groupBuysService.update(id, dto);
  }
}
