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
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validKeyHash: Buffer | null;

  constructor(private readonly configService: ConfigService) {
    const rawKey = this.configService.get<string>('API_KEY')?.trim();
    this.validKeyHash = rawKey ? this.hashKey(rawKey) : null;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const rawApiKey = request.headers['x-api'];
    const apiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;
    const normalizedApiKey = apiKey?.trim();

    const validApiKeyHash = this.validKeyHash;

    if (!normalizedApiKey) {
      this.logger.warn({
        reason: 'missing header',
        ...this.getRequestContext(request, context),
      });
      throw new UnauthorizedException();
    }

    if (!validApiKeyHash) {
      this.logger.warn({
        reason: 'no server key',
        ...this.getRequestContext(request, context),
      });
      throw new UnauthorizedException();
    }

    if (!this.isValidApiKey(normalizedApiKey, validApiKeyHash)) {
      this.logger.warn({
        reason: 'invalid key',
        ...this.getRequestContext(request, context),
      });
      throw new UnauthorizedException();
    }

    return true;
  }

  private getRequestContext(request: Request, context: ExecutionContext) {
    const userAgent = request.headers['user-agent'];

    return {
      method: request.method,
      url: request.url,
      path:
        (request.route as { path?: string } | undefined)?.path ?? request.path,
      client: this.getClientIdentifier(request),
      target: this.getRequestTarget(context),
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  private isValidApiKey(providedKey: string, validKeyHash: Buffer): boolean {
    const providedHash = this.hashKey(providedKey);
    return timingSafeEqual(providedHash, validKeyHash);
  }

  private hashKey(key: string): Buffer {
    return createHash('sha256').update(key).digest();
  }

  private getClientIdentifier(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;

    if (typeof forwardedValue === 'string' && forwardedValue.trim()) {
      return forwardedValue.split(',')[0].trim();
    }

    return request.ip ?? 'unknown';
  }

  private getRequestTarget(context: ExecutionContext): string {
    const handlerName = context.getHandler()?.name ?? 'unknownHandler';
    const className = context.getClass()?.name ?? 'unknownClass';

    return `${className}.${handlerName}`;
  }
}
