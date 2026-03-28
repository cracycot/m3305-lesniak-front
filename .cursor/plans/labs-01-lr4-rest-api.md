# Task 01: LR4 — RESTful API + Swagger

## Objective
Implement RESTful API controllers for all modules with validation, pagination, and Swagger documentation.

## Dependencies
- Task 00 must be done (AllExceptionsFilter exists)

## Packages to Install (run in backend/)
```
npm install class-validator class-transformer @nestjs/swagger
```

## Files to Create/Modify

### DTOs (add class-validator decorators to existing + new)
- `backend/src/objects/dto/create-object.dto.ts` — add @IsString, @IsNumber, etc.
- `backend/src/objects/dto/update-object.dto.ts` — add PartialType
- `backend/src/categories/dto/create-category.dto.ts` — add validators
- `backend/src/categories/dto/update-category.dto.ts` — add PartialType  
- `backend/src/periods/dto/create-period.dto.ts` — add validators
- `backend/src/periods/dto/update-period.dto.ts` — create with PartialType
- `backend/src/feedback/dto/create-feedback.dto.ts` — add @IsEmail, etc.
- Create `backend/src/common/dto/pagination-query.dto.ts`
- Create `backend/src/common/dto/paginated-response.dto.ts`

### API Controllers (new files)
- `backend/src/objects/objects-api.controller.ts`
- `backend/src/categories/categories-api.controller.ts`
- `backend/src/periods/periods-api.controller.ts`
- `backend/src/feedback/feedback-api.controller.ts`

### Services updates
- `backend/src/objects/objects.service.ts` — add `findAllPaginated(page, limit)`, throw `NotFoundException` when not found
- `backend/src/categories/categories.service.ts` — throw `NotFoundException` when not found
- `backend/src/periods/periods.service.ts` — throw `NotFoundException` when not found
- `backend/src/feedback/feedback.service.ts` — throw `NotFoundException` when not found

### Module updates (register new controllers)
- `backend/src/objects/objects.module.ts`
- `backend/src/categories/categories.module.ts`
- `backend/src/periods/periods.module.ts`
- `backend/src/feedback/feedback.module.ts`

### App bootstrap
- `backend/src/main.ts` — add ValidationPipe globally, register Swagger

## Implementation Details

### Pagination
All list endpoints accept `?page=1&limit=10` query params.
Return `Link` header with `<url?page=prev>; rel="prev"` and `<url?page=next>; rel="next"`.

### Objects API Controller (`api/objects`)
- `GET /api/objects` — list with pagination, optional `?categoryId=` filter
- `GET /api/objects/:id` — single object with facts, category, periods
- `POST /api/objects` — create
- `PATCH /api/objects/:id` — partial update
- `DELETE /api/objects/:id` — delete
- `GET /api/objects/:id/facts` — get facts for object
- `GET /api/objects/:id/periods` — get periods for object

### Categories API Controller (`api/categories`)
- `GET /api/categories` — list with pagination
- `GET /api/categories/:id` — single
- `GET /api/categories/:id/objects` — objects in category with pagination
- `POST /api/categories` — create
- `PATCH /api/categories/:id` — update
- `DELETE /api/categories/:id` — delete

### Periods API Controller (`api/periods`)
- `GET /api/periods` — list with pagination
- `GET /api/periods/:id` — single
- `GET /api/periods/:id/objects` — objects in period with pagination
- `POST /api/periods` — create
- `PATCH /api/periods/:id` — update
- `DELETE /api/periods/:id` — delete

### Feedback API Controller (`api/feedback`)
- `GET /api/feedback` — list with pagination
- `GET /api/feedback/:id` — single
- `POST /api/feedback` — submit
- `DELETE /api/feedback/:id` — delete

### ValidationPipe in main.ts
```typescript
import { ValidationPipe } from '@nestjs/common';
app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }));
```

### Swagger setup in main.ts
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Ленинград после Победы API')
  .setDescription('RESTful API для исторических объектов Ленинграда')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

### DTO example with Swagger + validation:
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsUrl, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateObjectDto {
  @ApiProperty({ description: 'Название объекта', example: 'Исаакиевский собор' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ description: 'Год постройки/события', example: 1858 })
  @IsNumber()
  @Type(() => Number)
  year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
  // ... etc
}
```

## Acceptance Criteria
- All API endpoints return proper JSON with correct HTTP status codes
- Invalid input returns 400 with validation error details
- Not found returns 404
- Successful collection GET returns `Link` header for pagination
- Swagger UI available at `/api-docs` with all endpoints documented
- DTOs documented with @ApiProperty decorators
- One tag per module in Swagger
