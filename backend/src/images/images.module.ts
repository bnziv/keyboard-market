import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { R2Service } from '../group-buys/r2.service';

@Module({
  controllers: [ImagesController],
  providers: [R2Service],
})
export class ImagesModule {}
