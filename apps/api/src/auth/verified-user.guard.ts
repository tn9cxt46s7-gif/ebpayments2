import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class VerifiedUserGuard extends AuthGuard('jwt') {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    if (!result) return false;

    const req = context.switchToHttp().getRequest();
    if (req.user?.role === 'admin') return true;

    const user = await this.db.queryOne<{ kyc_status: string }>(
      'SELECT kyc_status FROM users WHERE id = $1',
      [req.user.userId],
    );

    if (user?.kyc_status !== 'verified') {
      throw new ForbiddenException({
        message: 'Пройдите верификацию для использования кошелька',
        code: 'KYC_REQUIRED',
        redirect: '/onboarding',
      });
    }
    return true;
  }
}
