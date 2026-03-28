# Task 03: LR6 — BFF Features (Interceptors, Caching, File Uploads)

## Objective
Implement request timing interceptor, ETag caching, in-memory server-side caching, and file upload to Yandex Object Storage (S3-compatible).

## Dependencies
- Task 01 (REST API) and Task 02 (GraphQL) must be done

## Packages to Install (run in backend/)
```
npm install @nestjs/cache-manager cache-manager
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
npm install multer @types/multer
npm install etag @types/etag
```

## Files to Create/Modify

### Interceptors
- `backend/src/common/interceptors/elapsed-time.interceptor.ts`
- `backend/src/common/interceptors/etag.interceptor.ts`

### Caching
- `backend/src/app.module.ts` — add CacheModule for categories

### Storage Module
- `backend/src/storage/storage.module.ts`
- `backend/src/storage/storage.service.ts`

### Objects updates
- `backend/src/objects/objects-api.controller.ts` — add file upload endpoint
- `backend/src/objects/objects.module.ts` — import StorageModule

### Decorators
- `backend/src/common/decorators/cache-control.decorator.ts`

### main.ts
- Register ElapsedTimeInterceptor globally

## Implementation Details

### ElapsedTimeInterceptor
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ElapsedTimeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const isApi = request.url.startsWith('/api/') || request.url.startsWith('/graphql');

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        this.logger.log(`${request.method} ${request.url} — ${elapsed}ms`);
        if (isApi) {
          response.setHeader('X-Elapsed-Time', `${elapsed}ms`);
        }
      }),
      map((data) => {
        if (!isApi && data && typeof data === 'object') {
          const elapsed = Date.now() - start;
          return { ...data, serverElapsedMs: elapsed };
        }
        return data;
      }),
    );
  }
}
```

### ETag Interceptor
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as etag from 'etag';
import { Request, Response } from 'express';

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (request.method === 'GET' && data) {
          const etagValue = etag(JSON.stringify(data));
          response.setHeader('ETag', etagValue);
          response.setHeader('Cache-Control', 'public, max-age=3600');

          const clientEtag = request.headers['if-none-match'];
          if (clientEtag === etagValue) {
            response.status(304).send();
            return null;
          }
        }
        return data;
      }),
    );
  }
}
```

### CacheModule setup in AppModule
```typescript
import { CacheModule } from '@nestjs/cache-manager';

// in imports:
CacheModule.register({ ttl: 5000, max: 100, isGlobal: true }),
```

### Use cache in CategoriesApiController
```typescript
import { UseInterceptors, CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Get()
findAll(@Args() pagination: PaginationArgs) { ... }
```

### StorageModule
```typescript
// storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET') ?? 'leningrad-objects';
    this.s3 = new S3Client({
      region: config.get<string>('S3_REGION') ?? 'ru-central1',
      endpoint: config.get<string>('S3_ENDPOINT') ?? 'https://storage.yandexcloud.net',
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY') ?? '',
        secretAccessKey: config.get<string>('S3_SECRET_KEY') ?? '',
      },
    });
  }

  async upload(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    }));
    const endpoint = this.config.get<string>('S3_ENDPOINT') ?? 'https://storage.yandexcloud.net';
    return `${endpoint}/${this.bucket}/${key}`;
  }
}
```

### File upload endpoint in ObjectsApiController
```typescript
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Post(':id/image')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\//)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
}))
@ApiConsumes('multipart/form-data')
@ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
  const key = `objects/${Date.now()}-${file.originalname}`;
  const url = await this.storageService.upload(key, file.buffer, file.mimetype);
  await this.objectsService.update(Number(id), { imageUrl: url });
  return { imageUrl: url };
}
```

### .env additions needed
```
S3_BUCKET=leningrad-objects
S3_REGION=ru-central1
S3_ENDPOINT=https://storage.yandexcloud.net
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
```

## Acceptance Criteria
- All API responses include `X-Elapsed-Time` header
- MVC responses include `serverElapsedMs` in template context
- GET /api/objects returns `ETag` header; repeat request with `If-None-Match` returns 304
- GET /api/categories is cached server-side (TTL 5s); rapid repeated requests served from cache
- POST /api/objects/:id/image uploads file and returns imageUrl
- Elapsed time logged to console for every request
