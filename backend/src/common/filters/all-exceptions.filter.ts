import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message =
                typeof res === 'string'
                    ? res
                    : (res as Record<string, unknown>).message
                      ? String((res as Record<string, unknown>).message)
                      : message;
        } else if (exception instanceof EntityNotFoundError) {
            status = HttpStatus.NOT_FOUND;
            message = 'Resource not found';
        } else if (exception instanceof QueryFailedError) {
            const pg = exception as unknown as { code?: string };
            if (pg.code === '23505') {
                status = HttpStatus.CONFLICT;
                message = 'Duplicate entry — resource already exists';
            } else if (pg.code === '23503') {
                status = HttpStatus.BAD_REQUEST;
                message = 'Foreign key constraint violation';
            } else if (pg.code === '23502') {
                status = HttpStatus.BAD_REQUEST;
                message = 'Required field is missing';
            } else if (pg.code === '22P02' || pg.code === '22003') {
                status = HttpStatus.BAD_REQUEST;
                message = 'Invalid input value';
            } else if (pg.code === '57P01' || pg.code === '08006' || pg.code === '08001' || pg.code === '08004') {
                status = HttpStatus.SERVICE_UNAVAILABLE;
                message = 'Database unavailable';
            } else {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'Database query failed';
            }
        } else if (exception instanceof TypeORMError) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = 'Database unavailable';
        } else if (exception instanceof Error && (exception as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = 'Service unavailable';
        }

        this.logger.error(
            `${request.method} ${request.url} → ${status}: ${message}`,
            exception instanceof Error ? exception.stack : String(exception),
        );

        // Если ответ уже начат (например, редирект/куки/stream) — нельзя менять заголовки/тело.
        if (response.headersSent) {
            return;
        }

        const isApiOrGraphql =
            request.url.startsWith('/api/') || request.url.startsWith('/graphql');

        if (isApiOrGraphql) {
            response.status(status).json({
                statusCode: status,
                message,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
        } else {
            try {
                response.status(status).render('error', {
                    title: 'Ошибка',
                    statusCode: status,
                    message,
                });
            } catch {
                response.status(status).json({
                    statusCode: status,
                    message,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                });
            }
        }
    }
}
