import { Body, Controller, Get, Post, Render, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PublicAccess } from './public.decorator';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'Email пользователя' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Пароль', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class RegisterDto {
    @ApiProperty({ description: 'Email пользователя' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Пароль', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('login')
    @PublicAccess()
    @ApiExcludeEndpoint()
    @Render('auth/login')
    loginPage() {
        return { title: 'Вход' };
    }

    @Get('register')
    @PublicAccess()
    @ApiExcludeEndpoint()
    @Render('auth/register')
    registerPage() {
        return { title: 'Регистрация' };
    }

    @Post('login')
    @PublicAccess()
    @ApiOperation({ summary: 'Войти в систему (email + password)' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Успешный вход, сессия установлена' })
    @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        const { email, password } = dto;

        try {
            // Используем supertokens-node напрямую через API
            const EmailPassword = await import('supertokens-node/recipe/emailpassword');
            const signInResult = await EmailPassword.default.signIn('public', email, password);

            if (signInResult.status !== 'OK') {
                if (req.headers['content-type']?.includes('application/json')) {
                    res.status(401).json({ message: 'Неверный email или пароль' });
                } else {
                    res.redirect('/auth/login?error=invalid_credentials');
                }
                return;
            }

            const supertokensNode = await import('supertokens-node');
            const Session = await import('supertokens-node/recipe/session');
            const session = await Session.default.createNewSession(
                req, res, 'public',
                new supertokensNode.default.RecipeUserId(signInResult.user.id),
            );

            if (req.headers['content-type']?.includes('application/json')) {
                const tokens = session.getAllSessionTokensDangerously();
                res.status(200).json({
                    message: 'OK',
                    userId: signInResult.user.id,
                    accessToken: tokens.accessToken,
                });
            } else {
                res.redirect('/');
            }
        } catch {
            if (req.headers['content-type']?.includes('application/json')) {
                res.status(503).json({ message: 'Сервис аутентификации недоступен' });
            } else {
                res.redirect('/auth/login?error=service_unavailable');
            }
        }
    }

    @Post('register')
    @PublicAccess()
    @ApiOperation({ summary: 'Зарегистрировать нового пользователя' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Пользователь создан' })
    @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
    async register(
        @Body() dto: RegisterDto,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        const { email, password } = dto;

        try {
            const EmailPassword = await import('supertokens-node/recipe/emailpassword');
            const signUpResult = await EmailPassword.default.signUp('public', email, password);

            if (signUpResult.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
                if (req.headers['content-type']?.includes('application/json')) {
                    res.status(409).json({ message: 'Пользователь с таким email уже существует' });
                } else {
                    res.redirect('/auth/register?error=email_exists');
                }
                return;
            }

            if (signUpResult.status !== 'OK') {
                if (req.headers['content-type']?.includes('application/json')) {
                    res.status(400).json({ message: 'Ошибка регистрации' });
                } else {
                    res.redirect('/auth/register?error=failed');
                }
                return;
            }

            const supertokensNode = await import('supertokens-node');
            const Session = await import('supertokens-node/recipe/session');
            await Session.default.createNewSession(
                req, res, 'public',
                new supertokensNode.default.RecipeUserId(signUpResult.user.id),
            );

            if (req.headers['content-type']?.includes('application/json')) {
                res.status(201).json({ message: 'Created', userId: signUpResult.user.id });
            } else {
                res.redirect('/');
            }
        } catch {
            if (req.headers['content-type']?.includes('application/json')) {
                res.status(503).json({ message: 'Сервис аутентификации недоступен' });
            } else {
                res.redirect('/auth/register?error=service_unavailable');
            }
        }
    }

    @Post('logout')
    @PublicAccess()
    @ApiOperation({ summary: 'Выйти из системы (завершить сессию)' })
    @ApiResponse({ status: 200, description: 'Сессия завершена' })
    async logout(
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        try {
            const Session = await import('supertokens-node/recipe/session');
            const session = await Session.default.getSession(req, { sessionRequired: false } as never);
            if (session) await session.revokeSession();
        } catch {
            // игнорируем ошибки при завершении сессии
        }

        if (req.headers['content-type']?.includes('application/json')) {
            res.status(200).json({ message: 'Logged out' });
        } else {
            res.redirect('/');
        }
    }
}
