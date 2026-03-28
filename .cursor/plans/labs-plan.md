# Labs Implementation Plan

## Project
NestJS backend at `backend/` — "Ленинград после Победы"
Stack: TypeORM + PostgreSQL, Handlebars views, modules: objects, categories, periods, feedback

## Phases

### Phase 0 — DB Error Fix
- [Task file](./labs-00-db-fix.md)
- Fix 500 errors when DB is unreachable; add global ExceptionFilter

### Phase 1 — LR4: RESTful API + Swagger
- [Task file](./labs-01-lr4-rest-api.md)
- Depends on: Phase 0
- Install class-validator, @nestjs/swagger; create API controllers; add ValidationPipe; add pagination; Swagger docs

### Phase 2 — LR5: GraphQL
- [Task file](./labs-02-lr5-graphql.md)
- Depends on: Phase 1
- Install @nestjs/graphql, @nestjs/apollo; code-first approach; resolvers, types, pagination, complexity limits

### Phase 3 — LR6: BFF Features
- [Task file](./labs-03-lr6-bff.md)
- Depends on: Phase 2
- ElapsedTimeInterceptor, ETag interceptor, CacheModule, file uploads with S3

### Phase 4 — LR7: Auth
- [Task file](./labs-04-lr7-auth.md)
- Depends on: Phase 3
- SuperTokens auth, AuthModule, AuthGuard, RolesGuard, CORS, view updates
