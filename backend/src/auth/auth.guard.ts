import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService, } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthenticatedUser } from './current-user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly authService: AuthService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
        const user = await this.authService.verifySession(request);

        if (!user) {
            throw new UnauthorizedException('Authentication required');
        }

        request.user = user;
        return true;
    }
}
