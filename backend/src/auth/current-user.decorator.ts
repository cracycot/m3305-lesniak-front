import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedUser {
    id: string;
    email: string;
    roles: string[];
}

/** Извлекает объект аутентифицированного пользователя из request */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
        const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
        return request.user;
    },
);
