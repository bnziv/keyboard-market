import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from './helpers/app.helper';
import { seedAdminUser, seedUser } from './helpers/seed.helper';

const GB_IMPORT_PAYLOAD = {
  items: [
    {
      topicId: 'topic-e2e-1',
      name: 'Test IC Keyboard',
      type: 'keyboard',
      status: 'IC',
    },
    {
      topicId: 'topic-e2e-2',
      name: 'Soon-To-Be-Hidden Keyboard',
      type: 'keyboard',
      status: 'GB',
    },
    {
      topicId: 'topic-e2e-3',
      name: 'Active GB Keyboard',
      type: 'keyboard',
      status: 'GB',
      gbEnd: '2099-12-31T00:00:00.000Z',
    },
  ],
};

describe('GroupBuys (e2e)', () => {
  let testApp: TestApp;
  let httpServer: App;
  let adminCookie: string;
  let regularCookie: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    httpServer = testApp.app.getHttpServer();

    const admin = await seedAdminUser(testApp.app);
    adminCookie = admin.cookie;

    const regular = await seedUser(testApp.app, { email: 'regular@test.com', username: 'regular' });
    regularCookie = regular.cookie;

    await request(httpServer)
      .post('/api/groupbuys/admin/import')
      .set('Cookie', adminCookie)
      .send(GB_IMPORT_PAYLOAD);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('GET /api/groupbuys', () => {
    it('returns only non-hidden group buys', async () => {
      // Find the "Soon-To-Be-Hidden" GB and hide it via admin PATCH
      const allRes = await request(httpServer)
        .get('/api/groupbuys/admin/all')
        .set('Cookie', adminCookie);
      const toHide = allRes.body.find((gb: any) => gb.name === 'Soon-To-Be-Hidden Keyboard');

      if (toHide) {
        await request(httpServer)
          .patch(`/api/groupbuys/admin/${toHide.id}`)
          .set('Cookie', adminCookie)
          .send({ hidden: true });
      }

      const res = await request(httpServer).get('/api/groupbuys');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // public shape does not expose hidden field, but the item should be absent
      expect(res.body.some((gb: any) => gb.name === 'Soon-To-Be-Hidden Keyboard')).toBe(false);
    });

    it('filters by stage=IC', async () => {
      const res = await request(httpServer).get('/api/groupbuys').query({ stage: 'IC' });

      expect(res.status).toBe(200);
      expect(res.body.every((gb: any) => gb.status === 'IC')).toBe(true);
    });

    it('filters by stage=GB', async () => {
      const res = await request(httpServer).get('/api/groupbuys').query({ stage: 'GB' });

      expect(res.status).toBe(200);
      expect(res.body.every((gb: any) => gb.status === 'GB')).toBe(true);
    });
  });

  describe('GET /api/groupbuys/counts', () => {
    it('returns IC, GB, closed, total, and closingSoon counts', async () => {
      const res = await request(httpServer).get('/api/groupbuys/counts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('IC');
      expect(res.body).toHaveProperty('GB');
      expect(res.body).toHaveProperty('closed');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('closingSoon');
    });
  });

  describe('GET /api/groupbuys/:id', () => {
    let gbId: string;

    beforeAll(async () => {
      const res = await request(httpServer).get('/api/groupbuys').query({ stage: 'IC' });
      gbId = res.body[0]?.id;
    });

    it('returns the public shape of a group buy', async () => {
      const res = await request(httpServer).get(`/api/groupbuys/${gbId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', gbId);
      expect(res.body).not.toHaveProperty('poster');
      expect(res.body).not.toHaveProperty('hidden');
      expect(res.body).not.toHaveProperty('excludedImages');
    });

    it('returns 404 for a nonexistent id', async () => {
      const res = await request(httpServer).get('/api/groupbuys/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('Admin endpoints', () => {
    describe('GET /api/groupbuys/admin/all', () => {
      it('returns all group buys including hidden ones for admin', async () => {
        const res = await request(httpServer)
          .get('/api/groupbuys/admin/all')
          .set('Cookie', adminCookie);

        expect(res.status).toBe(200);
        // admin/all returns every GB regardless of hidden status
        expect(res.body.some((gb: any) => gb.hidden === true)).toBe(true);
      });

      it('returns 403 for a non-admin user', async () => {
        const res = await request(httpServer)
          .get('/api/groupbuys/admin/all')
          .set('Cookie', regularCookie);

        expect(res.status).toBe(403);
      });

      it('returns 401 for an unauthenticated request', async () => {
        const res = await request(httpServer).get('/api/groupbuys/admin/all');
        expect(res.status).toBe(401);
      });
    });

    describe('PATCH /api/groupbuys/admin/:id', () => {
      let gbId: string;

      beforeAll(async () => {
        const res = await request(httpServer)
          .get('/api/groupbuys/admin/all')
          .set('Cookie', adminCookie);
        const ic = res.body.find((gb: any) => gb.status === 'IC');
        gbId = ic?.id;
      });

      it('updates the group buy and returns the admin shape', async () => {
        const res = await request(httpServer)
          .patch(`/api/groupbuys/admin/${gbId}`)
          .set('Cookie', adminCookie)
          .send({ name: 'Updated IC Keyboard' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Updated IC Keyboard');
        expect(res.body).toHaveProperty('hidden');
        expect(res.body).toHaveProperty('excludedImages');
      });

      it('returns 403 for a non-admin user', async () => {
        const res = await request(httpServer)
          .patch(`/api/groupbuys/admin/${gbId}`)
          .set('Cookie', regularCookie)
          .send({ name: 'Hacked Name' });

        expect(res.status).toBe(403);
      });

      it('hides a group buy — it disappears from public results', async () => {
        await request(httpServer)
          .patch(`/api/groupbuys/admin/${gbId}`)
          .set('Cookie', adminCookie)
          .send({ hidden: true });

        const publicRes = await request(httpServer).get('/api/groupbuys').query({ stage: 'IC' });
        const publicIds = publicRes.body.map((gb: any) => gb.id);
        expect(publicIds).not.toContain(gbId);
      });
    });

    describe('POST /api/groupbuys/admin/import', () => {
      it('bulk-imports group buys and returns the count', async () => {
        const res = await request(httpServer)
          .post('/api/groupbuys/admin/import')
          .set('Cookie', adminCookie)
          .send({ items: [{ topicId: 'topic-new-import', name: 'Import Test', type: 'keyboard', status: 'IC' }] });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('imported', 1);
      });

      it('returns 403 for a non-admin user', async () => {
        const res = await request(httpServer)
          .post('/api/groupbuys/admin/import')
          .set('Cookie', regularCookie)
          .send({ items: [] });

        expect(res.status).toBe(403);
      });
    });
  });
});
