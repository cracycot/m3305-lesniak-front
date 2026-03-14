import { Body, Controller, Get, Param, Post, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { PeriodsService } from './periods.service';

function buildSession(auth: string) {
    return auth === '1' ? { name: 'Кирилл', isAuth: true } : null;
}

@Controller('periods')
export class PeriodsController {
    constructor(private readonly periodsService: PeriodsService) {}

    @Get()
    @Render('periods/index')
    async getAll(@Query('auth') auth: string) {
        const periods = await this.periodsService.findAll();
        return { title: 'Исторические периоды', user: buildSession(auth), periods };
    }

    @Get('new')
    @Render('periods/new')
    getNew(@Query('auth') auth: string) {
        return { title: 'Добавить период', user: buildSession(auth) };
    }

    @Get(':id/edit')
    @Render('periods/edit')
    async getEdit(@Param('id') id: string, @Query('auth') auth: string) {
        const period = await this.periodsService.findOne(Number(id));
        return { title: `Редактировать: ${period?.name ?? ''}`, user: buildSession(auth), period };
    }

    @Post()
    async create(@Body() body: Record<string, string>, @Res() res: Response) {
        await this.periodsService.create({
            name: body.name,
            startYear: body.startYear ? Number(body.startYear) : undefined,
            endYear: body.endYear ? Number(body.endYear) : undefined,
            description: body.description || undefined,
        });
        res.redirect('/periods');
    }

    @Post(':id')
    async update(@Param('id') id: string, @Body() body: Record<string, string>, @Res() res: Response) {
        await this.periodsService.update(Number(id), {
            name: body.name,
            startYear: body.startYear ? Number(body.startYear) : undefined,
            endYear: body.endYear ? Number(body.endYear) : undefined,
            description: body.description || undefined,
        });
        res.redirect('/periods');
    }

    @Post(':id/delete')
    async remove(@Param('id') id: string, @Res() res: Response) {
        await this.periodsService.remove(Number(id));
        res.redirect('/periods');
    }
}
