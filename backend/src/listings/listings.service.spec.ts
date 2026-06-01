import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { Listing } from './schemas/listing.schema';

function chain(resolvedValue: any) {
  const q: any = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
  return q;
}

describe('ListingsService', () => {
  let service: ListingsService;
  let listingModel: any;

  beforeEach(async () => {
    listingModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: getModelToken(Listing.name), useValue: listingModel },
      ],
    }).compile();

    service = module.get(ListingsService);
  });

  describe('create', () => {
    it('attaches userId and persists the listing', async () => {
      const dto = { title: 'Test KB', condition: 'new', offers: false };
      const created = { ...dto, userId: 'u1' };
      listingModel.create.mockResolvedValue(created);

      const result = await service.create(dto as any, 'u1');

      expect(result).toEqual(created);
      expect(listingModel.create).toHaveBeenCalledWith({ ...dto, userId: 'u1' });
    });
  });

  describe('findAll', () => {
    it('returns all listings sorted by createdOn descending', async () => {
      const listings = [{ title: 'KB1' }, { title: 'KB2' }];
      listingModel.find.mockReturnValue(chain(listings));

      const result = await service.findAll();

      expect(result).toEqual(listings);
      expect(listingModel.find().sort).toHaveBeenCalledWith({ createdOn: -1 });
    });
  });

  describe('findById', () => {
    it('returns the listing when found', async () => {
      const listing = { _id: 'l1', title: 'My KB' };
      listingModel.findById.mockReturnValue(chain(listing));

      const result = await service.findById('l1');
      expect(result).toEqual(listing);
    });

    it('throws NotFoundException when listing does not exist', async () => {
      listingModel.findById.mockReturnValue(chain(null));

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('queries by userId and sorts by createdOn', async () => {
      listingModel.find.mockReturnValue(chain([]));

      await service.findByUserId('u1');

      expect(listingModel.find).toHaveBeenCalledWith({ userId: 'u1' });
    });
  });

  describe('countByUserId', () => {
    it('returns the count of listings for a user', async () => {
      listingModel.countDocuments.mockResolvedValue(5);

      const count = await service.countByUserId('u1');
      expect(count).toBe(5);
    });
  });

  describe('getFiltered', () => {
    it('returns paginated result with totals', async () => {
      const listings = [{ title: 'KB' }];
      listingModel.find.mockReturnValue(chain(listings));
      listingModel.countDocuments.mockResolvedValue(1);

      const result = await service.getFiltered({ page: 0, size: 12 });

      expect(result.listings).toEqual(listings);
      expect(result.currentPage).toBe(0);
      expect(result.totalItems).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies minPrice and maxPrice to the query', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ minPrice: 100, maxPrice: 500 });

      expect(listingModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ price: { $gte: 100, $lte: 500 } }),
      );
    });

    it('applies condition filter', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ condition: 'new' });

      expect(listingModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ condition: 'new' }),
      );
    });

    it('applies offers filter', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ offers: true });

      expect(listingModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ offers: true }),
      );
    });

    it('applies text search when title is provided', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ title: 'topre' });

      expect(listingModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $text: { $search: 'topre' } }),
      );
    });

    it('sorts ascending when sortDirection is asc', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ sortBy: 'price', sortDirection: 'asc' });

      expect(listingModel.find().sort).toHaveBeenCalledWith({ price: 1 });
    });

    it('skips and limits correctly for pagination', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ page: 2, size: 10 });

      expect(listingModel.find().sort().skip).toHaveBeenCalledWith(20);
      expect(listingModel.find().sort().skip().limit).toHaveBeenCalledWith(10);
    });

    it('does not apply minPrice when minPrice is 0', async () => {
      listingModel.find.mockReturnValue(chain([]));
      listingModel.countDocuments.mockResolvedValue(0);

      await service.getFiltered({ minPrice: 0, maxPrice: 200 });

      const callArg = listingModel.find.mock.calls[0][0];
      expect(callArg.price?.$gte).toBeUndefined();
    });
  });
});
