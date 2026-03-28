# Task 00: Fix DB 500 Error

## Objective
When the database is unreachable or a query fails, the app currently crashes with an unhandled 500.
Add a global ExceptionFilter that catches TypeORM errors and returns appropriate HTTP responses.

## Scope
- Create `backend/src/common/filters/http-exception.filter.ts` — handles `HttpException`
- Create `backend/src/common/filters/typeorm-exception.filter.ts` — catches TypeORM errors:
  - `EntityNotFoundError` → 404
  - `QueryFailedError` with unique violation (code 23505) → 409 Conflict
  - `QueryFailedError` with FK violation (code 23503) → 400 Bad Request
  - Connection errors / unknown DB errors → 503
- Register both filters globally in `main.ts` using `app.useGlobalFilters(...)`
- For MVC routes (Accept: text/html or no Content-Type: application/json), return HTML error page
- For API routes (`/api/...`), return JSON `{ statusCode, message, error }`

## Files to Create/Modify
- `backend/src/common/filters/all-exceptions.filter.ts` (combined filter)
- `backend/src/main.ts` — register filter globally

## Acceptance Criteria
- When DB is down, GET /objects returns a 503 response (JSON for API routes, HTML for MVC)
- When entity not found with TypeORM's findOneOrFail, API returns 404 JSON, MVC returns HTML error
- No unhandled promise rejections in logs for DB errors

## Implementation Details

### all-exceptions.filter.ts
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message ?? message;
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
    } else if (exception instanceof QueryFailedError) {
      const pg = exception as any;
      if (pg.code === '23505') { status = HttpStatus.CONFLICT; message = 'Duplicate entry'; }
      else if (pg.code === '23503') { status = HttpStatus.BAD_REQUEST; message = 'Foreign key constraint violation'; }
      else { status = HttpStatus.SERVICE_UNAVAILABLE; message = 'Database error'; }
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database unavailable';
    }

    this.logger.error(`${request.method} ${request.url} → ${status}: ${message}`, exception instanceof Error ? exception.stack : String(exception));

    const isApi = request.url.startsWith('/api/') || request.url.startsWith('/graphql');
    if (isApi) {
      response.status(status).json({ statusCode: status, message, timestamp: new Date().toISOString(), path: request.url });
    } else {
      response.status(status).render('error', { title: 'Ошибка', statusCode: status, message });
    }
  }
}
```

### main.ts additions
```typescript
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
// in bootstrap():
app.useGlobalFilters(new AllExceptionsFilter());
```

### views/error.hbs (create error template)
Simple Handlebars template showing error status and message.
