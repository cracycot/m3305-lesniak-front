import { Body, Controller, Get, Param, Post, Query, Render } from '@nestjs/common';
import { Response } from 'express';
import { Res } from '@nestjs/common';
import { CategoriesService } from './categories.service';

function buildSession(auth: string) {
    return auth === '1' ? { name: 'Кирилл', isAuth: true } : null;
}

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Get()
    @Render('categories/index')
    async getAll(@Query('auth') auth: string) {
        const categories = await this.categoriesService.findAll();
        return { title: 'Категории', user: buildSession(auth), categories };
    }

    @Get('new')
    @Render('categories/new')
    getNew(@Query('auth') auth: string) {
        return { title: 'Добавить категорию', user: buildSession(auth) };
    }

    @Get(':id/edit')
    @Render('categories/edit')
    async getEdit(@Param('id') id: string, @Query('auth') auth: string) {
        const category = await this.categoriesService.findOne(Number(id));
        return { title: `Редактировать: ${category?.name ?? ''}`, user: buildSession(auth), category };
    }

    @Post()
    async create(@Body() body: Record<string, string>, @Res() res: Response) {
        await this.categoriesService.create({
            name: body.name,
            description: body.description || undefined,
        });
        res.redirect('/categories');
    }

    @Post(':id')
    async update(@Param('id') id: string, @Body() body: Record<string, string>, @Res() res: Response) {
        await this.categoriesService.update(Number(id), {
            name: body.name,
            description: body.description || undefined,
        });
        res.redirect('/categories');
    }

    @Post(':id/delete')
    async remove(@Param('id') id: string, @Res() res: Response) {
        await this.categoriesService.remove(Number(id));
        res.redirect('/categories');
    }
}
