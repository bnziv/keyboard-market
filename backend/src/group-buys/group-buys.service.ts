import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Observable } from 'rxjs';
import { Model } from 'mongoose';
import { GroupBuy, GroupBuyDocument } from './schemas/group-buy.schema';
import { UpdateGroupBuyDto } from './dto/update-group-buy.dto';
import { runScraper } from './scraper';

export interface PublicGroupBuyShape {
  id: string;
  topicId: string | undefined;
  name: string | undefined;
  type: string | undefined;
  status: string;
  designer: string | undefined;
  overview: string | undefined;
  gbStart: string | null;
  gbEnd: string | null;
  estimatedFulfillment: string | null;
  basePrice: { amount: number; currency: string } | null;
  items: { name: string; price: number; currency: string }[];
  vendors: { region: string; name: string; url: string }[];
  discordUrl: string | null;
  sourceUrl: string | null;
  images: string[];
  scrapedAt: Date | null;
}

export interface AdminGroupBuyShape extends PublicGroupBuyShape {
  status: string;
  poster: string | null;
  excludedImages: string[];
  hidden: boolean;
}

function toPublicShape(doc: any): PublicGroupBuyShape {
  const now = new Date().toISOString();
  const status = doc.status === 'GB' && doc.gb_end && doc.gb_end <= now ? 'closed' : doc.status;

  return {
    id: doc._id?.toString(),
    topicId: doc.topic_id,
    name: doc.name,
    type: doc.type,
    status,
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
  };
}

function toAdminShape(doc: any): AdminGroupBuyShape {
  return {
    ...toPublicShape(doc),
    status: doc.status,  // raw status so admin edit form reflects DB value
    poster: doc.poster ?? null,
    excludedImages: doc.excludedImages ?? [],
    hidden: doc.hidden ?? false,
  };
}

function buildStageQuery(stage: string, now: string): Record<string, any> {
  if (stage === 'IC') return { status: 'IC' };
  if (stage === 'GB') {
    return {
      status: 'GB',
      $or: [{ gb_end: null }, { gb_end: { $gt: now } }],
    };
  }
  if (stage === 'closed') {
    return {
      $or: [
        { status: 'closed' },
        { status: 'GB', gb_end: { $ne: null, $lte: now } },
      ],
    };
  }
  return {};
}

@Injectable()
export class GroupBuysService {
  constructor(@InjectModel(GroupBuy.name) private groupBuyModel: Model<GroupBuyDocument>) {}

  private async mapScraperItems(parsed: any[]) {
    const topicIds = parsed.map(i => i.topic_id).filter(Boolean);
    const existingIds = new Set(
      (await this.groupBuyModel.find({ topic_id: { $in: topicIds } }, { topic_id: 1 }).lean().exec() as any[])
        .map(d => d.topic_id as string),
    );
    return parsed.map(item => ({
      data: toAdminShape(item),
      alreadyExists: item.topic_id ? existingIds.has(item.topic_id) : false,
      hasError: !!item.parse_error,
      errorMessage: item.parse_error as string | undefined,
    }));
  }

  async findAll(stage?: string) {
    const now = new Date().toISOString();
    const query: any = {
      hidden: { $ne: true },
      ...(stage ? buildStageQuery(stage, now) : {}),
    };
    const docs = await this.groupBuyModel.find(query).lean().exec();
    return docs.map(toPublicShape);
  }

  async getCounts() {
    const now = new Date().toISOString();
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const [grouped, closingSoon] = await Promise.all([
      this.groupBuyModel.aggregate([
        { $match: { hidden: { $ne: true } } },
        {
          $addFields: {
            effectiveStatus: {
              $cond: {
                if: { $and: [
                  { $eq: ['$status', 'GB'] },
                  { $ne: ['$gb_end', null] },
                  { $lte: ['$gb_end', now] },
                ]},
                then: 'closed',
                else: '$status',
              },
            },
          },
        },
        { $group: { _id: '$effectiveStatus', count: { $sum: 1 } } },
      ]).exec(),
      this.groupBuyModel.countDocuments({
        hidden: { $ne: true },
        status: 'GB',
        gb_end: { $ne: null, $gt: now, $lte: in48h },
      }).exec(),
    ]);

    const byStatus: Record<string, number> = {};
    for (const { _id, count } of grouped) {
      if (_id) byStatus[_id] = count;
    }

    return {
      IC: byStatus['IC'] ?? 0,
      GB: byStatus['GB'] ?? 0,
      closed: byStatus['closed'] ?? 0,
      total: Object.values(byStatus).reduce((s, n) => s + n, 0),
      closingSoon,
    };
  }

  async findAllAdmin(status?: string) {
    const query = status ? { status } : {};
    const docs = await this.groupBuyModel.find(query).lean().exec();
    return docs.map(toAdminShape);
  }

  async findOne(id: string) {
    const doc = await this.groupBuyModel.findById(id).lean().exec() as any;
    if (!doc) throw new NotFoundException('Group buy not found');
    return toPublicShape(doc);
  }

  async findOneAdmin(id: string) {
    const doc = await this.groupBuyModel.findById(id).lean().exec() as any;
    if (!doc) throw new NotFoundException('Group buy not found');
    return toAdminShape(doc);
  }

  async update(id: string, dto: UpdateGroupBuyDto) {
    const doc = await this.groupBuyModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .lean()
      .exec() as any;
    if (!doc) throw new NotFoundException('Group buy not found');
    return toAdminShape(doc);
  }

  scraperStream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let aborted = false;

      const timeoutId = setTimeout(() => {
        aborted = true;
        subscriber.next({ data: { type: 'error', message: 'Scraper timed out after 120 seconds' } });
        subscriber.complete();
      }, 120_000);

      const onLog = (msg: string) => {
        if (!aborted) subscriber.next({ data: { type: 'log', message: msg } });
      };

      runScraper({ maxTopics: 10, onLog, groupBuyModel: this.groupBuyModel })
        .then(async (scraped) => {
          if (aborted) return;
          clearTimeout(timeoutId);
          const items = await this.mapScraperItems(scraped);
          subscriber.next({ data: { type: 'result', items } });
          subscriber.complete();
        })
        .catch((err: Error) => {
          if (aborted) return;
          clearTimeout(timeoutId);
          subscriber.next({ data: { type: 'error', message: err.message } });
          subscriber.complete();
        });

      return () => {
        aborted = true;
        clearTimeout(timeoutId);
      };
    });
  }

  async bulkImport(items: UpdateGroupBuyDto[]): Promise<{ imported: number }> {
    if (!items.length) return { imported: 0 };
    const ops = items.map(item =>
      item.topic_id
        ? { updateOne: { filter: { topic_id: item.topic_id }, update: { $set: item }, upsert: true } }
        : { insertOne: { document: item } },
    );
    await this.groupBuyModel.bulkWrite(ops as any);
    return { imported: items.length };
  }
}
