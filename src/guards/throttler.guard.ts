import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerRequest } from '@nestjs/throttler/dist/throttler.guard.interface';

const ONE_DAY_MS = 86_400_000;

const TIER_LIMITS: Record<string, number> = {
  FREE:  50,
  BASIC: 500,
  PRO:   5000,
  MEGA:  50000,
};

@Injectable()
export class RapidApiThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.headers as Record<string, string | string[]>;
    const rapidUser = user['x-rapidapi-user'];
    return (Array.isArray(rapidUser) ? rapidUser[0] : rapidUser) ?? (req.ip as string) ?? 'unknown';
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const req = requestProps.context.switchToHttp().getRequest<Record<string, unknown>>();
    const headers = req.headers as Record<string, string>;
    const sub = (headers['x-rapidapi-subscription'] ?? 'FREE').toUpperCase();
    const limit = TIER_LIMITS[sub] ?? TIER_LIMITS.FREE;

    return super.handleRequest({ ...requestProps, limit, ttl: ONE_DAY_MS });
  }
}
