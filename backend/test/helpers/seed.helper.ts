import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

export interface SeededUser {
  id: string;
  username: string;
  cookie: string;
}

export async function seedUser(
  app: INestApplication<App>,
  overrides: { email?: string; username?: string; password?: string } = {},
): Promise<SeededUser> {
  const email = overrides.email ?? `user_${Date.now()}@test.com`;
  const username = overrides.username ?? `user${Date.now()}`;
  const password = overrides.password ?? 'TestPass123!';

  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, username, password });

  if (res.status !== 201) {
    throw new Error(`seedUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const cookie = (res.headers['set-cookie'] as string[] | string | undefined);
  const cookieStr = Array.isArray(cookie) ? cookie[0] : cookie ?? '';

  const meRes = await request(app.getHttpServer())
    .get('/api/auth/me')
    .set('Cookie', cookieStr);

  return { id: meRes.body.id, username: meRes.body.username, cookie: cookieStr };
}

export async function seedAdminUser(app: INestApplication<App>): Promise<SeededUser> {
  const user = await seedUser(app, {
    email: 'admin@test.com',
    username: 'admin',
    password: 'AdminPass123!',
  });

  process.env.ADMIN_USER_ID = user.id;

  return user;
}

export async function seedListing(
  app: INestApplication<App>,
  cookie: string,
  overrides: Record<string, any> = {},
) {
  const res = await request(app.getHttpServer())
    .post('/api/listings')
    .set('Cookie', cookie)
    .send({
      title: 'Test Keyboard',
      description: 'A great keyboard for testing',
      price: 150,
      offers: false,
      condition: 'new',
      ...overrides,
    });

  if (res.status !== 201) {
    throw new Error(`seedListing failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

export async function seedGroupBuy(
  app: INestApplication<App>,
  cookie: string,
  overrides: Record<string, any> = {},
) {
  const res = await request(app.getHttpServer())
    .post('/api/groupbuys/admin/import')
    .set('Cookie', cookie)
    .send({
      items: [{
        topicId: `topic-${Date.now()}`,
        name: 'Test GB',
        type: 'keyboard',
        status: 'IC',
        ...overrides,
      }],
    });

  if (res.status !== 201) {
    throw new Error(`seedGroupBuy failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
}
