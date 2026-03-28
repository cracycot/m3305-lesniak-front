import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './current-user.decorator';

/**
 * Middleware для MVC-маршрутов: если пользователь не авторизован,
 * перенаправляет на страницу логина.
 */
@Injectable()
export class AuthRedirectMiddleware implements NestMiddleware {
    constructor(private readonly authService: AuthService) {}

    async use(req: Request & { user?: AuthenticatedUser }, res: Response, next: NextFunction): Promise<void> {
        const user = await this.authService.verifySession(req);
        if (user) {
            req.user = user;
            next();
        } else {
            res.redirect('/auth/login');
        }
    }
}
