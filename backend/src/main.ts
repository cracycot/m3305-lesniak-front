import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as fs from 'fs';
import * as hbs from 'hbs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');

    // Регистрируем партиалы вручную, чтобы имена с дефисом работали корректно
    const partialsDir = join(__dirname, '..', 'views', 'partials');
    for (const file of fs.readdirSync(partialsDir)) {
        if (!file.endsWith('.hbs')) continue;
        const name = file.replace(/\.hbs$/, '');
        const template = fs.readFileSync(join(partialsDir, file), 'utf8');
        hbs.registerPartial(name, template);
    }

    // Helpers
    hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

    // CORS — разрешаем запросы с фронтенда и SuperTokens-заголовки
    app.enableCors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
        allowedHeaders: [
            'content-type',
            'rid',
            'fdi-version',
            'anti-csrf',
            'st-auth-mode',
            'authorization',
        ],
        credentials: true,
    });

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new RequestTimingInterceptor());
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
        }),
    );

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Ленинград после Победы API')
        .setDescription('RESTful API для исторических объектов послевоенного Ленинграда')
        .setVersion('1.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'SuperTokens Access Token' },
            'supertokens',
        )
        .addCookieAuth('sAccessToken', { type: 'apiKey', in: 'cookie', name: 'sAccessToken' }, 'cookie-auth')
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);

    // Middleware для SuperTokens (обрабатывает /auth/signinup и другие ST-маршруты)
    if (process.env.SUPERTOKENS_CONNECTION_URI) {
        const { middleware: stMiddleware } = await import('supertokens-node/framework/express');
        app.use(stMiddleware());
    }

    const port = process.env.PORT ?? 3080;
    await app.listen(port, '0.0.0.0');
}
bootstrap();
