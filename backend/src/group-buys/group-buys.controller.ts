import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GroupBuysService } from './group-buys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateGroupBuyDto } from './dto/update-group-buy.dto';
import { SetFlagsDto } from './dto/set-flags.dto';
import { BulkImportDto } from './dto/bulk-import.dto';

@Controller('groupbuys')
export class GroupBuysController {
  constructor(private readonly groupBuysService: GroupBuysService) {}

  @Get()
  findAll(@Query('stage') stage?: string) {
    return this.groupBuysService.findAll(stage);
  }

  @Get('counts')
  getCounts() {
    return this.groupBuysService.getCounts();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin(@Query('status') status?: string) {
    return this.groupBuysService.findAllAdmin(status);
  }

  @Get('admin/scrape/stream')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Sse()
  scraperStream(): Observable<MessageEvent> {
    return this.groupBuysService.scraperStream();
  }

  @Post('admin/scrape/single')
  @UseGuards(JwtAuthGuard, AdminGuard)
  scrapeTopicPreview(@Body('topicUrl') topicUrl: string) {
    if (!topicUrl) throw new BadRequestException('topicUrl is required');
    return this.groupBuysService.scrapeTopicPreview(topicUrl);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOneAdmin(@Param('id') id: string) {
    return this.groupBuysService.findOneAdmin(id);
  }

  @Patch('admin/:id/flags')
  @UseGuards(JwtAuthGuard, AdminGuard)
  setFlags(@Param('id') id: string, @Body() dto: SetFlagsDto) {
    return this.groupBuysService.setFlags(id, dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGroupBuyDto) {
    return this.groupBuysService.update(id, dto);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkImport(@Body() dto: BulkImportDto) {
    return this.groupBuysService.bulkImport(dto.items);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupBuysService.findOne(id);
  }
}
