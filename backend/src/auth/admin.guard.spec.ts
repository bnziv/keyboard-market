import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function makeContext(userId?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: userId ? { userId } : {},
      }),
    }),
  } as any;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
    process.env.ADMIN_USER_ID = 'admin-123';
  });

  afterEach(() => {
    delete process.env.ADMIN_USER_ID;
  });

  it('returns true when userId matches ADMIN_USER_ID', () => {
    expect(guard.canActivate(makeContext('admin-123'))).toBe(true);
  });

  it('throws ForbiddenException when userId does not match', () => {
    expect(() => guard.canActivate(makeContext('other-user'))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when userId is missing', () => {
    expect(() => guard.canActivate(makeContext())).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when ADMIN_USER_ID env var is not set', () => {
    delete process.env.ADMIN_USER_ID;
    expect(() => guard.canActivate(makeContext('admin-123'))).toThrow(ForbiddenException);
  });
});
