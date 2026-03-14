import { Body, Controller, Get, Param, Post, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { FeedbackService } from './feedback.service';

function buildSession(auth: string) {
    return auth === '1' ? { name: 'Кирилл', isAuth: true } : null;
}

@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Get()
    @Render('feedback/new')
    getForm(@Query('auth') auth: string, @Query('sent') sent: string) {
        return { title: 'Обратная связь', user: buildSession(auth), feedbackPage: true, sent: sent === '1' };
    }

    @Get('list')
    @Render('feedback/index')
    async getList(@Query('auth') auth: string) {
        const items = await this.feedbackService.findAll();
        return { title: 'Сообщения', user: buildSession(auth), items };
    }

    @Post()
    async submit(@Body() body: Record<string, string>, @Res() res: Response) {
        await this.feedbackService.create({
            name: body.name ?? 'Аноним',
            email: body.email ?? '',
            message: body.message ?? '',
        });
        res.redirect('/feedback?sent=1');
    }

    @Post(':id/delete')
    async remove(@Param('id') id: string, @Res() res: Response) {
        await this.feedbackService.remove(Number(id));
        res.redirect('/feedback/list');
    }
}
