import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupBuy, GroupBuyDocument } from './schemas/group-buy.schema';

@Injectable()
export class GroupBuysService {
  constructor(@InjectModel(GroupBuy.name) private groupBuyModel: Model<GroupBuyDocument>) {}

  async findAll(status?: string) {
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
      gbStart: doc.gb_start ?? null,
      gbEnd: doc.gb_end ?? null,
      estimatedFulfillment: doc.estimated_fulfillment ?? null,
      basePrice: doc.base_price ?? null,
      items: doc.items ?? [],
      vendors: doc.vendors ?? [],
      discordUrl: doc.discord_url ?? null,
      sourceUrl: doc.source_url ?? null,
      images: doc.images ?? [],
      scrapedAt: doc.scraped_at ?? null,
    }));
  }
}
