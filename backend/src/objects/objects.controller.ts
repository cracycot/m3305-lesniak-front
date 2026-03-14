import { Body, Controller, Get, MessageEvent, Param, Post, Query, Render, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObjectsService } from './objects.service';
import { CategoriesService } from '../categories/categories.service';

function buildSession(auth: string) {
    return auth === '1' ? { name: 'Кирилл', isAuth: true } : null;
}

@Controller('objects')
export class ObjectsController {
    constructor(
        private readonly objectsService: ObjectsService,
        private readonly categoriesService: CategoriesService,
    ) {}

    @Sse('events')
    serverSentEvents(): Observable<MessageEvent> {
        return this.objectsService.created$.pipe(
            map((obj) => ({
                data: JSON.stringify({ id: obj.id, title: obj.title }),
            } as MessageEvent)),
        );
    }

    @Get()
    @Render('objects/index')
    async getAll(@Query('auth') auth: string) {
        const objects = await this.objectsService.findAll();
        return { title: 'Исторические объекты', user: buildSession(auth), objects, sseEnabled: true };
    }

    @Get('new')
    @Render('objects/new')
    async getNew(@Query('auth') auth: string) {
        const categories = await this.categoriesService.findAll();
        return { title: 'Добавить объект', user: buildSession(auth), categories };
    }

    @Get(':id/edit')
    @Render('objects/edit')
    async getEdit(@Param('id') id: string, @Query('auth') auth: string) {
        const [obj, categories] = await Promise.all([
            this.objectsService.findOne(Number(id)),
            this.categoriesService.findAll(),
        ]);
        return {
            title: `Редактировать: ${obj?.title ?? ''}`,
            user: buildSession(auth),
            object: obj,
            categories,
        };
    }

    @Get(':id')
    @Render('objects/show')
    async getOne(@Param('id') id: string, @Query('auth') auth: string) {
        const obj = await this.objectsService.findOne(Number(id));
        return { title: obj?.title ?? 'Объект', user: buildSession(auth), object: obj };
    }

    @Post()
    async create(@Body() body: Record<string, string>, @Res() res: Response) {
        const facts = body.facts
            ? String(body.facts).split('\n').map((f) => f.trim()).filter(Boolean)
            : [];
        const created = await this.objectsService.create({
            title: body.title ?? 'Без названия',
            year: Number(body.year) || new Date().getFullYear(),
            imageUrl: body.imageUrl || undefined,
            imageAlt: body.imageAlt || body.title || undefined,
            imageCaption: body.imageCaption || undefined,
            description: body.description || undefined,
            categoryId: body.categoryId ? Number(body.categoryId) : undefined,
            facts,
        });
        res.redirect(`/objects/${created.id}`);
    }

    @Post(':id')
    async update(@Param('id') id: string, @Body() body: Record<string, string>, @Res() res: Response) {
        const facts = body.facts
            ? String(body.facts).split('\n').map((f) => f.trim()).filter(Boolean)
            : [];
        await this.objectsService.update(Number(id), {
            title: body.title,
            year: body.year ? Number(body.year) : undefined,
            imageUrl: body.imageUrl || undefined,
            imageAlt: body.imageAlt || body.title || undefined,
            imageCaption: body.imageCaption || undefined,
            description: body.description || undefined,
            categoryId: body.categoryId ? Number(body.categoryId) : undefined,
            facts,
        });
        res.redirect(`/objects/${id}`);
    }

    @Post(':id/delete')
    async remove(@Param('id') id: string, @Res() res: Response) {
        await this.objectsService.remove(Number(id));
        res.redirect('/objects');
    }
}
