# Task 04: LR7 — Authentication & Authorization (SuperTokens)

## Objective
Implement authentication using SuperTokens, with guards, roles, Swagger security docs, CORS, and view updates.

## Dependencies
- All previous tasks must be done

## Packages to Install (run in backend/)
```
npm install supertokens-node
```

## Files to Create/Modify

### Auth Module
- `backend/src/auth/auth.module.ts` — dynamic module with `forRoot(config)`
- `backend/src/auth/supertokens.service.ts` — initializes SuperTokens
- `backend/src/auth/auth.middleware.ts` — middleware for verifying sessions / redirecting
- `backend/src/auth/auth.guard.ts` — global AuthGuard (CanActivate)
- `backend/src/auth/roles.guard.ts` — RolesGuard
- `backend/src/auth/decorators/public.decorator.ts` — @PublicAccess()
- `backend/src/auth/decorators/roles.decorator.ts` — @Roles('admin')

### Config
- `backend/src/app.module.ts` — import AuthModule.forRoot(...)
- `backend/src/main.ts` — configure CORS, register AuthGuard globally

### View updates
- `backend/views/partials/header.hbs` — show user info or login link

## Implementation Details

### SuperTokens init (supertokens.service.ts)
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import UserRoles from 'supertokens-node/recipe/userroles';

@Injectable()
export class SupertokensService {
  constructor(private readonly config: ConfigService) {
    supertokens.init({
      framework: 'express',
      supertokens: {
        connectionURI: config.get<string>('SUPERTOKENS_CONNECTION_URI') ?? '',
        apiKey: config.get<string>('SUPERTOKENS_API_KEY'),
      },
      appInfo: {
        appName: 'Leningrad After Victory',
        apiDomain: config.get<string>('APP_URL') ?? 'http://localhost:3000',
        websiteDomain: config.get<string>('APP_URL') ?? 'http://localhost:3000',
        apiBasePath: '/auth',
        websiteBasePath: '/auth',
      },
      recipeList: [
        EmailPassword.init(),
        Session.init(),
        UserRoles.init(),
      ],
    });
  }
}
```

### AuthModule (dynamic)
```typescript
import { DynamicModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupertokensService } from './supertokens.service';
import { AuthMiddleware } from './auth.middleware';

export interface AuthModuleConfig {
  connectionURI: string;
  apiKey?: string;
}

@Module({})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }

  static forRoot(config: AuthModuleConfig): DynamicModule {
    return {
      module: AuthModule,
      providers: [SupertokensService, { provide: 'SUPERTOKENS_CONFIG', useValue: config }],
      exports: [SupertokensService],
      global: true,
    };
  }
}
```

### AuthGuard
```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import Session from 'supertokens-node/recipe/session';
import { Error as STError } from 'supertokens-node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    try {
      req.session = await Session.getSession(req, res, { sessionRequired: true });
      return true;
    } catch (err) {
      if (STError.isErrorFromSuperTokens(err) && err.type === STError.TRY_REFRESH_TOKEN) {
        // session expired
      }
      return false;
    }
  }
}
```

### @PublicAccess decorator
```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const PublicAccess = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### @Roles decorator
```typescript
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### AuthMiddleware
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { middleware } from 'supertokens-node/framework/express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    return middleware()(req, res, next);
  }
}
```

### CORS in main.ts
```typescript
import { middleware as supertokensMiddleware, errorHandler } from 'supertokens-node/framework/express';
import supertokens from 'supertokens-node';

app.enableCors({
  origin: process.env.APP_URL ?? 'http://localhost:3000',
  allowedHeaders: ['Content-Type', ...supertokens.getAllCORSHeaders()],
  credentials: true,
});
app.use(supertokensMiddleware());
app.use(errorHandler());
```

### AppModule additions
```typescript
import { AuthModule } from './auth/auth.module';
// in imports:
AuthModule.forRoot({
  connectionURI: process.env.SUPERTOKENS_CONNECTION_URI ?? '',
  apiKey: process.env.SUPERTOKENS_API_KEY,
}),
```

### .env additions
```
SUPERTOKENS_CONNECTION_URI=https://try.supertokens.com
SUPERTOKENS_API_KEY=
APP_URL=http://localhost:3000
```

### Swagger security
```typescript
// in DocumentBuilder:
.addCookieAuth('sAccessToken')
// on controllers requiring auth:
@ApiCookieAuth()
```

### Mark public routes
All API endpoints that are read-only (GET) should remain public.
Mutation endpoints (POST, PATCH, DELETE) should require auth.
MVC routes: apply @PublicAccess() where appropriate.

## Acceptance Criteria
- SuperTokens middleware handles /auth/* routes
- Unauthenticated requests to protected API endpoints return 401
- Admin-only endpoints return 403 for non-admin users
- CORS headers present in responses
- Swagger shows lock icon on protected endpoints
- Views show user name in header when logged in, login link otherwise
