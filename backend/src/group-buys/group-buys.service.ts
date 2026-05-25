import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupBuy, GroupBuyDocument } from './schemas/group-buy.schema';
import { UpdateGroupBuyDto } from './dto/update-group-buy.dto';

@Injectable()
export class GroupBuysService {
  constructor(@InjectModel(GroupBuy.name) private groupBuyModel: Model<GroupBuyDocument>) {}

  async findAll(status?: string) {
    const query = status ? { status } : {};
    const docs = await this.groupBuyModel.find(query).lean().exec();

    return docs.map((doc: any) => {
      const excluded: string[] = doc.excludedImages ?? [];
      return {
        id: doc._id?.toString(),
        topicId: doc.topic_id,
        name: doc.name,
        type: doc.type,
        status: doc.status,
        designer: doc.designer,
        overview: doc.overview,
        gbStart: doc.gb_start ?? null,
        gbEnd: doc.gb_end ?? null,
        estimatedFulfillment: doc.estimated_fulfillment ?? null,
        basePrice: doc.base_price ?? null,
        items: doc.items ?? [],
        vendors: doc.vendors ?? [],
        discordUrl: doc.discord_url ?? null,
        sourceUrl: doc.source_url ?? null,
        images: (doc.images ?? []).filter((img: string) => !excluded.includes(img)),
        scrapedAt: doc.scraped_at ?? null,
      };
    });
  }

  async findAllAdmin(status?: string) {
    const query = status ? { status } : {};
    const docs = await this.groupBuyModel.find(query).lean().exec();

    return docs.map((doc: any) => ({
      id: doc._id?.toString(),
      topicId: doc.topic_id,
      name: doc.name,
      type: doc.type,
      status: doc.status,
      designer: doc.designer,
      overview: doc.overview,
      poster: doc.poster ?? null,
      gbStart: doc.gb_start ?? null,
      gbEnd: doc.gb_end ?? null,
      estimatedFulfillment: doc.estimated_fulfillment ?? null,
      basePrice: doc.base_price ?? null,
      items: doc.items ?? [],
      vendors: doc.vendors ?? [],
      discordUrl: doc.discord_url ?? null,
      sourceUrl: doc.source_url ?? null,
      images: doc.images ?? [],
      excludedImages: doc.excludedImages ?? [],
      scrapedAt: doc.scraped_at ?? null,
    }));
  }

  async findOne(id: string) {
    const doc = await this.groupBuyModel.findById(id).lean().exec() as any;
    if (!doc) throw new NotFoundException('Group buy not found');

    return {
      id: doc._id?.toString(),
      topicId: doc.topic_id,
      name: doc.name,
      type: doc.type,
      status: doc.status,
      designer: doc.designer,
      overview: doc.overview,
      poster: doc.poster ?? null,
      gbStart: doc.gb_start ?? null,
      gbEnd: doc.gb_end ?? null,
      estimatedFulfillment: doc.estimated_fulfillment ?? null,
      basePrice: doc.base_price ?? null,
      items: doc.items ?? [],
      vendors: doc.vendors ?? [],
      discordUrl: doc.discord_url ?? null,
      sourceUrl: doc.source_url ?? null,
      images: doc.images ?? [],
      excludedImages: doc.excludedImages ?? [],
      scrapedAt: doc.scraped_at ?? null,
    };
  }

  async update(id: string, dto: UpdateGroupBuyDto) {
    const doc = await this.groupBuyModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .lean()
      .exec() as any;
    if (!doc) throw new NotFoundException('Group buy not found');

    return {
      id: doc._id?.toString(),
      topicId: doc.topic_id,
      name: doc.name,
      type: doc.type,
      status: doc.status,
      designer: doc.designer,
      overview: doc.overview,
      poster: doc.poster ?? null,
      gbStart: doc.gb_start ?? null,
      gbEnd: doc.gb_end ?? null,
      estimatedFulfillment: doc.estimated_fulfillment ?? null,
      basePrice: doc.base_price ?? null,
      items: doc.items ?? [],
      vendors: doc.vendors ?? [],
      discordUrl: doc.discord_url ?? null,
      sourceUrl: doc.source_url ?? null,
      images: doc.images ?? [],
      excludedImages: doc.excludedImages ?? [],
      scrapedAt: doc.scraped_at ?? null,
    };
  }
}
