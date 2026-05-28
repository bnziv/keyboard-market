import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupBuy, GroupBuySchema } from './schemas/group-buy.schema';
import { GroupBuysService } from './group-buys.service';
import { GroupBuysController } from './group-buys.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: GroupBuy.name, schema: GroupBuySchema }])],
  providers: [GroupBuysService],
  controllers: [GroupBuysController],
})
export class GroupBuysModule {}
