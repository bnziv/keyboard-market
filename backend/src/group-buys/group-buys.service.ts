import { Injectable, Logger, MessageEvent, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Observable } from 'rxjs';
import { Model } from 'mongoose';
import { GroupBuy, GroupBuyDocument } from './schemas/group-buy.schema';
import { UpdateGroupBuyDto } from './dto/update-group-buy.dto';
import { ImportGroupBuyDto } from './dto/import-group-buy.dto';
import { runScraper } from './scraper';
import { R2Service } from './r2.service';

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
  poster: string | null;
  excludedImages: string[];
  hidden: boolean;
}

function toPublicShape(
  doc: any,
  now = new Date().toISOString(),
): PublicGroupBuyShape {
  const status =
    doc.status === 'GB' && doc.gbEnd && doc.gbEnd <= now
      ? 'closed'
      : doc.status;

  return {
    id: doc._id?.toString(),
    topicId: doc.topicId,
    name: doc.name,
    type: doc.type,
    status,
    designer: doc.designer,
    overview: doc.overview,
    gbStart: doc.gbStart ?? null,
    gbEnd: doc.gbEnd ?? null,
    estimatedFulfillment: doc.estimatedFulfillment ?? null,
    basePrice: doc.basePrice ?? null,
    items: doc.items ?? [],
    vendors: doc.vendors ?? [],
    discordUrl: doc.discordUrl ?? null,
    sourceUrl: doc.sourceUrl ?? null,
    images: doc.images ?? [],
    scrapedAt: doc.scrapedAt ?? null,
  };
}

function toAdminShape(doc: any): AdminGroupBuyShape {
  return {
    ...toPublicShape(doc),
    status: doc.status, // raw status so admin edit form reflects DB value
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
      $or: [{ gbEnd: null }, { gbEnd: { $gt: now } }],
    };
  }
  if (stage === 'closed') {
    return {
      $or: [
        { status: 'closed' },
        { status: 'GB', gbEnd: { $ne: null, $lte: now } },
      ],
    };
  }
  return {};
}

@Injectable()
export class GroupBuysService {
  private readonly logger = new Logger(GroupBuysService.name);

  constructor(
    @InjectModel(GroupBuy.name) private groupBuyModel: Model<GroupBuyDocument>,
    private readonly r2: R2Service,
  ) {}

  private async mapScraperItems(parsed: any[]) {
    const topicIds = parsed.map((i) => i.topicId).filter(Boolean);
    const existingIds = new Set(
      (
        (await this.groupBuyModel
          .find({ topicId: { $in: topicIds } }, { topicId: 1 })
          .lean()
          .exec()) as any[]
      ).map((d) => d.topicId as string),
    );
    return parsed.map((item) => ({
      data: toAdminShape(item),
      alreadyExists: item.topicId ? existingIds.has(item.topicId) : false,
      hasError: !!item.parseError,
      errorMessage: item.parseError as string | undefined,
    }));
  }

  async findAll(stage?: string) {
    const now = new Date().toISOString();
    const query: any = {
      hidden: { $ne: true },
      ...(stage ? buildStageQuery(stage, now) : {}),
    };
    const docs = await this.groupBuyModel.find(query).lean().exec();
    return docs.map((doc) => toPublicShape(doc, now));
  }

  async getCounts() {
    const now = new Date().toISOString();
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const [grouped, closingSoon] = await Promise.all([
      this.groupBuyModel
        .aggregate([
          { $match: { hidden: { $ne: true } } },
          {
            $addFields: {
              effectiveStatus: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ['$status', 'GB'] },
                      { $ne: ['$gbEnd', null] },
                      { $lte: ['$gbEnd', now] },
                    ],
                  },
                  then: 'closed',
                  else: '$status',
                },
              },
            },
          },
          { $group: { _id: '$effectiveStatus', count: { $sum: 1 } } },
        ])
        .exec(),
      this.groupBuyModel
        .countDocuments({
          hidden: { $ne: true },
          status: 'GB',
          gbEnd: { $ne: null, $gt: now, $lte: in48h },
        })
        .exec(),
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

  private async fetchDoc(id: string) {
    const doc = (await this.groupBuyModel.findById(id).lean().exec()) as any;
    if (!doc) throw new NotFoundException('Group buy not found');
    return doc;
  }

  async findOne(id: string) {
    return toPublicShape(await this.fetchDoc(id));
  }
  async findOneAdmin(id: string) {
    return toAdminShape(await this.fetchDoc(id));
  }

  async update(id: string, dto: UpdateGroupBuyDto) {
    const doc = (await this.groupBuyModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .lean()
      .exec()) as any;
    if (!doc) throw new NotFoundException('Group buy not found');
    return toAdminShape(doc);
  }

  scraperStream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let aborted = false;

      const timeoutId = setTimeout(() => {
        aborted = true;
        subscriber.next({
          data: {
            type: 'error',
            message: 'Scraper timed out after 120 seconds',
          },
        });
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

  private async migrateDocImages(
    doc: ImportGroupBuyDto,
  ): Promise<ImportGroupBuyDto> {
    const topicId = doc.topicId ?? 'unknown';
    const migrateUrl = async (url: string): Promise<string> => {
      if (this.r2.isR2Url(url) || !this.r2.isImageUrl(url)) return url;
      try {
        return await this.r2.uploadFromUrl(url, this.r2.buildKey(topicId, url));
      } catch {
        return url;
      }
    };
    const [images, poster] = await Promise.all([
      doc.images ? Promise.all(doc.images.map(migrateUrl)) : Promise.resolve(undefined),
      doc.poster ? migrateUrl(doc.poster) : Promise.resolve(undefined),
    ]);
    return {
      ...doc,
      ...(images !== undefined ? { images } : {}),
      ...(poster !== undefined ? { poster } : {}),
    };
  }

  private async migrateDocsInBatches(
    docs: ImportGroupBuyDto[],
    batchSize = 3,
  ): Promise<ImportGroupBuyDto[]> {
    const results: ImportGroupBuyDto[] = [];
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = await Promise.all(
        docs.slice(i, i + batchSize).map((d) => this.migrateDocImages(d)),
      );
      results.push(...batch);
    }
    return results;
  }

  async bulkImport(items: ImportGroupBuyDto[]): Promise<{ imported: number }> {
    if (!items.length) return { imported: 0 };
    const migrated = this.r2.isConfigured()
      ? await this.migrateDocsInBatches(items)
      : items;
    const ops = migrated.map((item) =>
      item.topicId
        ? {
            updateOne: {
              filter: { topicId: item.topicId },
              update: { $set: item },
              upsert: true,
            },
          }
        : { insertOne: { document: item } },
    );
    await this.groupBuyModel.bulkWrite(ops as any);
    return { imported: items.length };
  }

}
