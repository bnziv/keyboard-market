import { createTestApp, closeTestApp, TestApp } from './helpers/app.helper';
import request from 'supertest';
import { App } from 'supertest/types';

describe('AppModule (e2e)', () => {
  let testApp: TestApp;
  let httpServer: App;

  beforeAll(async () => {
    testApp = await createTestApp();
    httpServer = testApp.app.getHttpServer();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('GET /api/groupbuys returns 200', async () => {
    const res = await request(httpServer).get('/api/groupbuys');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/listings/all returns 200', async () => {
    const res = await request(httpServer).get('/api/listings/all');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
