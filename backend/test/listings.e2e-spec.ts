import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from './helpers/app.helper';
import { seedUser, seedListing } from './helpers/seed.helper';

describe('Listings (e2e)', () => {
  let testApp: TestApp;
  let httpServer: App;
  let cookie: string;
  let userId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    httpServer = testApp.app.getHttpServer();

    const user = await seedUser(testApp.app, {
      email: 'seller@example.com',
      username: 'seller',
    });
    cookie = user.cookie;
    userId = user.id;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('POST /api/listings', () => {
    it('creates a listing for an authenticated user', async () => {
      const res = await request(httpServer)
        .post('/api/listings')
        .set('Cookie', cookie)
        .send({
          title: 'Keychron Q1',
          description: 'Excellent 75% keyboard',
          price: 180,
          offers: false,
          condition: 'new',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('title', 'Keychron Q1');
      expect(res.body).toHaveProperty('userId', userId);
    });

    it('returns 401 for an unauthenticated request', async () => {
      const res = await request(httpServer)
        .post('/api/listings')
        .send({ title: 'Unauthorized KB', condition: 'new' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(httpServer)
        .post('/api/listings')
        .set('Cookie', cookie)
        .send({ price: 100 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/listings/all', () => {
    it('returns a list of all listings', async () => {
      await seedListing(testApp.app, cookie, { title: 'All-Test KB' });

      const res = await request(httpServer).get('/api/listings/all');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((l: any) => l.title === 'All-Test KB')).toBe(true);
    });
  });

  describe('GET /api/listings/filtered', () => {
    beforeAll(async () => {
      await seedListing(testApp.app, cookie, { title: 'Budget KB', price: 50, condition: 'used' });
      await seedListing(testApp.app, cookie, { title: 'Premium KB', price: 300, condition: 'new' });
    });

    it('filters by condition', async () => {
      const res = await request(httpServer)
        .get('/api/listings/filtered')
        .query({ condition: 'used' });

      expect(res.status).toBe(200);
      expect(res.body.listings.every((l: any) => l.condition === 'used')).toBe(true);
    });

    it('returns pagination metadata', async () => {
      const res = await request(httpServer)
        .get('/api/listings/filtered')
        .query({ page: 0, size: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentPage', 0);
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body.listings.length).toBeLessThanOrEqual(2);
    });

    it('filters by maxPrice', async () => {
      const res = await request(httpServer)
        .get('/api/listings/filtered')
        .query({ maxPrice: 100 });

      expect(res.status).toBe(200);
      expect(res.body.listings.every((l: any) => !l.price || l.price <= 100)).toBe(true);
    });
  });

  describe('GET /api/listings/:id', () => {
    let listingId: string;

    beforeAll(async () => {
      const listing = await seedListing(testApp.app, cookie, { title: 'Detail KB' });
      listingId = listing.id ?? listing._id;
    });

    it('returns the listing by id', async () => {
      const res = await request(httpServer).get(`/api/listings/${listingId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', 'Detail KB');
    });

    it('returns 404 for a nonexistent id', async () => {
      const res = await request(httpServer).get('/api/listings/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/listings/username/:username', () => {
    it('returns listings for the given seller', async () => {
      await seedListing(testApp.app, cookie, { title: 'Profile KB' });

      const res = await request(httpServer).get('/api/listings/username/seller');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((l: any) => l.title === 'Profile KB')).toBe(true);
    });
  });
});
