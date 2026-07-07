import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const GENERIC_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Resource not found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error({
      status,
      message: exception instanceof Error ? exception.message : 'Unknown error',
    });

    if (status < 500 && exception instanceof HttpException) {
      const originalResponse = exception.getResponse();

      let responseBody: Record<string, unknown>;

      if (typeof originalResponse === 'string') {
        responseBody = { message: originalResponse };
      } else if (
        typeof originalResponse === 'object' &&
        originalResponse !== null
      ) {
        responseBody = { ...(originalResponse as Record<string, unknown>) };
        if (!responseBody.message) {
          responseBody.message = GENERIC_MESSAGES[status] ?? 'Bad request';
        }
      } else {
        responseBody = { message: GENERIC_MESSAGES[status] ?? 'Bad request' };
      }

      response.status(status).json({ statusCode: status, ...responseBody });
      return;
    }

    response.status(status).json({
      statusCode: status,
      message: GENERIC_MESSAGES[status] ?? 'An unexpected error occurred',
    });
  }
}
