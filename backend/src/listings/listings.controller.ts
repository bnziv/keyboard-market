import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ListingsService } from './listings.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListingRequestDto } from './dto/listing-request.dto';
import { ListingFilterDto } from './dto/listing-filter.dto';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: ListingRequestDto, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.listingsService.create(dto, userId);
  }

  @Get('all')
  findAll() {
    return this.listingsService.findAll();
  }

  @Get('filtered')
  getFiltered(@Query() filter: ListingFilterDto) {
    return this.listingsService.getFiltered(filter);
  }

  @Get('search/title')
  searchByTitle(@Query('title') title: string) {
    return this.listingsService.searchByTitle(title ?? '');
  }

  @Get('username/:username')
  async getByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return this.listingsService.findByUserId(user._id.toString());
  }

  @Get('details/:id')
  async getDetails(@Param('id') id: string) {
    const listing = await this.listingsService.findById(id);
    const seller = await this.usersService.findById(listing.userId);
    if (!seller) throw new NotFoundException('Seller not found');

    const totalListings = await this.listingsService.countByUserId(
      listing.userId,
    );

    return {
      id: listing._id.toString(),
      title: listing.title,
      price: listing.price,
      offers: listing.offers,
      description: listing.description,
      condition: listing.condition,
      imageUrl: listing.imageUrl,
      createdOn: listing['createdOn'],
      seller: {
        id: seller._id.toString(),
        username: seller.username,
        dateJoined: seller['dateJoined'],
        totalListings,
      },
    };
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }
}
