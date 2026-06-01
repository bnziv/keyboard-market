import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from './helpers/app.helper';

describe('Auth (e2e)', () => {
  let testApp: TestApp;
  let httpServer: App;

  beforeAll(async () => {
    testApp = await createTestApp();
    httpServer = testApp.app.getHttpServer();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and sets a JWT cookie', async () => {
      const res = await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'alice@example.com', username: 'alice', password: 'Pass1234!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username', 'alice');

      const cookies = res.headers['set-cookie'];
      expect(Array.isArray(cookies) ? cookies.join('') : cookies).toMatch(/jwt=/);
    });

    it('returns 409 when the email is already registered', async () => {
      await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'bob@example.com', username: 'bob', password: 'Pass1234!' });

      const res = await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'bob@example.com', username: 'bob2', password: 'Pass1234!' });

      expect(res.status).toBe(409);
    });

    it('returns 409 when the username is already taken', async () => {
      await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'carol@example.com', username: 'carol', password: 'Pass1234!' });

      const res = await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'carol2@example.com', username: 'carol', password: 'Pass1234!' });

      expect(res.status).toBe(409);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'incomplete@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'dave@example.com', username: 'dave', password: 'Pass1234!' });
    });

    it('logs in with email and returns a JWT cookie', async () => {
      const res = await request(httpServer)
        .post('/api/auth/login')
        .send({ identifier: 'dave@example.com', password: 'Pass1234!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username', 'dave');

      const cookies = res.headers['set-cookie'];
      expect(Array.isArray(cookies) ? cookies.join('') : cookies).toMatch(/jwt=/);
    });

    it('logs in with username (case-insensitive)', async () => {
      const res = await request(httpServer)
        .post('/api/auth/login')
        .send({ identifier: 'DAVE', password: 'Pass1234!' });

      expect(res.status).toBe(200);
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(httpServer)
        .post('/api/auth/login')
        .send({ identifier: 'dave', password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown identifier', async () => {
      const res = await request(httpServer)
        .post('/api/auth/login')
        .send({ identifier: 'nobody', password: 'Pass1234!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let cookie: string;

    beforeAll(async () => {
      const res = await request(httpServer)
        .post('/api/auth/register')
        .send({ email: 'eve@example.com', username: 'eve', password: 'Pass1234!' });

      const raw = res.headers['set-cookie'];
      cookie = Array.isArray(raw) ? raw[0] : raw;
    });

    it('returns the current user when authenticated', async () => {
      const res = await request(httpServer)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username', 'eve');
    });

    it('returns 401 when no cookie is provided', async () => {
      const res = await request(httpServer).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the JWT cookie', async () => {
      const res = await request(httpServer).post('/api/auth/logout');

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('') : (cookies ?? '');
      expect(cookieStr).toMatch(/jwt=;|jwt=(?:;|$)/);
    });
  });
});
