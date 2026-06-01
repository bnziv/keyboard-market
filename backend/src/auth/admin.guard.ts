import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    const adminId = process.env.ADMIN_USER_ID;
    if (!adminId || userId !== adminId) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
