import { Controller, Get, Query, Render } from '@nestjs/common';

function buildSession(auth: string) {
    return auth === '1' ? { name: 'Кирилл', isAuth: true } : null;
}

@Controller()
export class AppController {
    @Get()
    @Render('index')
    getIndex(@Query('auth') auth: string) {
        return { title: 'Главная', user: buildSession(auth) };
    }

    @Get('about')
    @Render('about')
    getAbout(@Query('auth') auth: string) {
        return { title: 'О проекте', user: buildSession(auth) };
    }
}
