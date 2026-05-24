import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Listing.name, schema: ListingSchema }]),
    UsersModule,
  ],
  providers: [ListingsService],
  controllers: [ListingsController],
  exports: [ListingsService, MongooseModule],
})
export class ListingsModule {}
