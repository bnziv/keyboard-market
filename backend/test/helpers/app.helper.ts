import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

export interface TestApp {
  app: INestApplication;
  mongod: MongoMemoryServer;
}

export async function createTestApp(): Promise<TestApp> {
  const mongod = await MongoMemoryServer.create();

  process.env.DB_URL = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
  process.env.ADMIN_USER_ID = 'admin-placeholder';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();

  return { app, mongod };
}

export async function closeTestApp({ app, mongod }: TestApp) {
  await app.close();
  await mongod.stop();
}
