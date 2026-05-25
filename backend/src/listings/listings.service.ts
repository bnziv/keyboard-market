import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { Listing, ListingDocument } from './schemas/listing.schema';
import { ListingRequestDto } from './dto/listing-request.dto';
import { ListingFilterDto } from './dto/listing-filter.dto';

@Injectable()
export class ListingsService {
  constructor(@InjectModel(Listing.name) private listingModel: Model<ListingDocument>) {}

  async create(dto: ListingRequestDto, userId: string): Promise<ListingDocument> {
    return this.listingModel.create({ ...dto, userId });
  }

  async findAll(): Promise<ListingDocument[]> {
    return this.listingModel.find().sort({ createdOn: -1 }).exec();
  }

  async findById(id: string): Promise<ListingDocument> {
    const listing = await this.listingModel.findById(id).exec();
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async findByUserId(userId: string): Promise<ListingDocument[]> {
    return this.listingModel.find({ userId }).sort({ createdOn: -1 }).exec();
  }

  async findByUsername(username: string, userId: string): Promise<ListingDocument[]> {
    return this.listingModel.find({ userId }).sort({ createdOn: -1 }).exec();
  }

  async searchByTitle(title: string): Promise<ListingDocument[]> {
    return this.listingModel
      .find({ title: { $regex: title, $options: 'i' } })
      .sort({ createdOn: -1 })
      .exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.listingModel.countDocuments({ userId });
  }

  async getFiltered(filter: ListingFilterDto) {
    const query: FilterQuery<Listing> = {};

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined && filter.minPrice > 0) {
        query.price.$gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        query.price.$lte = filter.maxPrice;
      }
    }

    if (filter.condition) query.condition = filter.condition;
    if (filter.title) query.title = { $regex: filter.title, $options: 'i' };
    if (filter.offers !== undefined) query.offers = filter.offers;

    const page = filter.page ?? 0;
    const size = filter.size ?? 12;
    const sortBy = filter.sortBy ?? 'createdOn';
    const sortDir: SortOrder = filter.sortDirection === 'asc' ? 1 : -1;

    const [listings, total] = await Promise.all([
      this.listingModel
        .find(query)
        .sort({ [sortBy]: sortDir })
        .skip(page * size)
        .limit(size)
        .exec(),
      this.listingModel.countDocuments(query),
    ]);

    return {
      listings,
      currentPage: page,
      totalItems: total,
      totalPages: Math.ceil(total / size),
    };
  }
}
