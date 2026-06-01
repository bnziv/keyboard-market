import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { GroupBuysService } from './group-buys.service';
import { GroupBuy } from './schemas/group-buy.schema';

jest.mock('./scraper', () => ({ runScraper: jest.fn() }));

function leanChain(resolvedValue: any) {
  return {
    lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(resolvedValue) }),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
}

function makeDoc(overrides: Record<string, any> = {}) {
  return {
    _id: { toString: () => 'gb1' },
    topicId: 'topic-1',
    name: 'Keychron Q1',
    type: 'keyboard',
    status: 'GB',
    designer: 'Keychron',
    overview: 'An overview',
    gbStart: '2025-01-01T00:00:00.000Z',
    gbEnd: '2026-12-31T00:00:00.000Z',
    estimatedFulfillment: '2027-01-01',
    basePrice: { amount: 150, currency: 'USD' },
    items: [],
    vendors: [],
    discordUrl: null,
    sourceUrl: null,
    images: ['img1.jpg'],
    excludedImages: [],
    poster: 'poster.jpg',
    hidden: false,
    scrapedAt: null,
    ...overrides,
  };
}

describe('GroupBuysService', () => {
  let service: GroupBuysService;
  let gbModel: any;

  beforeEach(async () => {
    gbModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      aggregate: jest.fn(),
      countDocuments: jest.fn(),
      bulkWrite: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        GroupBuysService,
        { provide: getModelToken(GroupBuy.name), useValue: gbModel },
      ],
    }).compile();

    service = module.get(GroupBuysService);
  });

  describe('findAll', () => {
    it('always filters out hidden group buys', async () => {
      gbModel.find.mockReturnValue(leanChain([]));

      await service.findAll();

      expect(gbModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ hidden: { $ne: true } }),
      );
    });

    it('applies IC stage query', async () => {
      gbModel.find.mockReturnValue(leanChain([]));

      await service.findAll('IC');

      expect(gbModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'IC' }),
      );
    });

    it('applies GB stage query with open gbEnd filter', async () => {
      gbModel.find.mockReturnValue(leanChain([]));

      await service.findAll('GB');

      const query = gbModel.find.mock.calls[0][0];
      expect(query.status).toBe('GB');
      expect(query.$or).toBeDefined();
    });

    it('applies closed stage query', async () => {
      gbModel.find.mockReturnValue(leanChain([]));

      await service.findAll('closed');

      const query = gbModel.find.mock.calls[0][0];
      expect(query.$or).toBeDefined();
    });

    it('maps docs to public shape (no poster, excludedImages, hidden)', async () => {
      gbModel.find.mockReturnValue(leanChain([makeDoc()]));

      const results = await service.findAll();

      expect(results[0]).not.toHaveProperty('poster');
      expect(results[0]).not.toHaveProperty('excludedImages');
      expect(results[0]).not.toHaveProperty('hidden');
    });

    it('auto-closes a GB whose gbEnd is in the past', async () => {
      const past = '2020-01-01T00:00:00.000Z';
      gbModel.find.mockReturnValue(leanChain([makeDoc({ status: 'GB', gbEnd: past })]));

      const results = await service.findAll();

      expect(results[0].status).toBe('closed');
    });

    it('does not auto-close a GB whose gbEnd is in the future', async () => {
      const future = '2099-12-31T00:00:00.000Z';
      gbModel.find.mockReturnValue(leanChain([makeDoc({ status: 'GB', gbEnd: future })]));

      const results = await service.findAll();

      expect(results[0].status).toBe('GB');
    });
  });

  describe('findOne', () => {
    it('returns public shape for an existing group buy', async () => {
      gbModel.findById.mockReturnValue(leanChain(makeDoc()));

      const result = await service.findOne('gb1');

      expect(result.id).toBe('gb1');
      expect(result).not.toHaveProperty('poster');
    });

    it('throws NotFoundException when not found', async () => {
      gbModel.findById.mockReturnValue(leanChain(null));

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneAdmin', () => {
    it('returns admin shape including poster, excludedImages, and hidden', async () => {
      gbModel.findById.mockReturnValue(leanChain(makeDoc()));

      const result = await service.findOneAdmin('gb1');

      expect(result).toHaveProperty('poster');
      expect(result).toHaveProperty('excludedImages');
      expect(result).toHaveProperty('hidden');
    });

    it('preserves raw status in admin shape (not auto-closed)', async () => {
      const past = '2020-01-01T00:00:00.000Z';
      gbModel.findById.mockReturnValue(leanChain(makeDoc({ status: 'GB', gbEnd: past })));

      const result = await service.findOneAdmin('gb1');

      expect(result.status).toBe('GB');
    });
  });

  describe('findAllAdmin', () => {
    it('returns all docs without hidden filter', async () => {
      gbModel.find.mockReturnValue(leanChain([makeDoc({ hidden: true })]));

      const results = await service.findAllAdmin();

      expect(gbModel.find).toHaveBeenCalledWith({});
      expect(results[0]).toHaveProperty('hidden', true);
    });

    it('filters by status when provided', async () => {
      gbModel.find.mockReturnValue(leanChain([]));

      await service.findAllAdmin('IC');

      expect(gbModel.find).toHaveBeenCalledWith({ status: 'IC' });
    });
  });

  describe('update', () => {
    it('updates and returns admin shape', async () => {
      const updated = makeDoc({ name: 'Updated Name' });
      gbModel.findByIdAndUpdate.mockReturnValue(leanChain(updated));

      const result = await service.update('gb1', { name: 'Updated Name' } as any);

      expect(result.name).toBe('Updated Name');
      expect(gbModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'gb1',
        { $set: { name: 'Updated Name' } },
        { new: true },
      );
    });

    it('throws NotFoundException when group buy does not exist', async () => {
      gbModel.findByIdAndUpdate.mockReturnValue(leanChain(null));

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkImport', () => {
    it('returns { imported: 0 } for empty input', async () => {
      const result = await service.bulkImport([]);
      expect(result).toEqual({ imported: 0 });
      expect(gbModel.bulkWrite).not.toHaveBeenCalled();
    });

    it('calls bulkWrite and returns the count', async () => {
      gbModel.bulkWrite.mockResolvedValue({});

      const items = [{ topicId: 'topic-1', name: 'KB' }] as any;
      const result = await service.bulkImport(items);

      expect(gbModel.bulkWrite).toHaveBeenCalled();
      expect(result).toEqual({ imported: 1 });
    });

    it('uses upsert by topicId when topicId is present', async () => {
      gbModel.bulkWrite.mockResolvedValue({});

      await service.bulkImport([{ topicId: 'topic-1', name: 'KB' }] as any);

      const ops = gbModel.bulkWrite.mock.calls[0][0];
      expect(ops[0]).toHaveProperty('updateOne');
      expect(ops[0].updateOne.filter).toEqual({ topicId: 'topic-1' });
      expect(ops[0].updateOne.upsert).toBe(true);
    });

    it('uses insertOne when topicId is absent', async () => {
      gbModel.bulkWrite.mockResolvedValue({});

      await service.bulkImport([{ name: 'KB' }] as any);

      const ops = gbModel.bulkWrite.mock.calls[0][0];
      expect(ops[0]).toHaveProperty('insertOne');
    });
  });

  describe('getCounts', () => {
    // aggregate().exec() and countDocuments().exec() are both chained in the service
    function mockAggregate(value: any[]) {
      gbModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue(value) });
    }
    function mockCountDocs(value: number) {
      gbModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(value) });
    }

    it('returns zeroed counts when aggregation returns empty results', async () => {
      mockAggregate([]);
      mockCountDocs(0);

      const result = await service.getCounts();

      expect(result).toEqual({ IC: 0, GB: 0, closed: 0, total: 0, closingSoon: 0 });
    });

    it('maps aggregation results into named status counts', async () => {
      mockAggregate([
        { _id: 'IC', count: 3 },
        { _id: 'GB', count: 5 },
        { _id: 'closed', count: 2 },
      ]);
      mockCountDocs(1);

      const result = await service.getCounts();

      expect(result).toEqual({ IC: 3, GB: 5, closed: 2, total: 10, closingSoon: 1 });
    });
  });
});
