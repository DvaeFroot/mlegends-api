import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual, createHash } from 'crypto';

@Injectable()
export class RapidApiGuard implements CanActivate {
  private readonly logger = new Logger(RapidApiGuard.name);
  private readonly secretHash: Buffer | null;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('RAPIDAPI_PROXY_SECRET')?.trim();
    this.secretHash = raw ? createHash('sha256').update(raw).digest() : null;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.headers['x-rapidapi-proxy-secret'];
    const provided = (Array.isArray(raw) ? raw[0] : raw)?.trim();

    if (!provided || !this.secretHash) {
      this.logger.warn({ reason: !provided ? 'missing header' : 'no server secret', url: request.url });
      throw new UnauthorizedException();
    }

    const providedHash = createHash('sha256').update(provided).digest();
    if (!timingSafeEqual(providedHash, this.secretHash)) {
      this.logger.warn({ reason: 'invalid secret', url: request.url });
      throw new UnauthorizedException();
    }

    return true;
  }
}
