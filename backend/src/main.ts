import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import * as hbs from 'hbs';
import { AppModule } from './app.module';

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

    const port = process.env.PORT ?? 3080;
    await app.listen(port, '0.0.0.0');
}
bootstrap();
