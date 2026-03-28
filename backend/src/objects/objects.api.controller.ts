import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    HttpCode,
    HttpStatus,
    Res,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiBody,
    ApiParam,
    ApiHeader,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { PublicAccess } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ObjectsService } from './objects.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import {
    ObjectResponseDto,
    PaginatedObjectResponseDto,
    ObjectFactResponseDto,
} from './dto/object-response.dto';
import { PeriodResponseDto } from '../periods/dto/period-response.dto';

function buildLinkHeader(basePath: string, page: number, limit: number, total: number): string {
    const links: string[] = [];
    const lastPage = Math.max(1, Math.ceil(total / limit));

    links.push(`<${basePath}?page=1&limit=${limit}>; rel="first"`);
    if (page > 1) links.push(`<${basePath}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    if (page < lastPage) links.push(`<${basePath}?page=${page + 1}&limit=${limit}>; rel="next"`);
    links.push(`<${basePath}?page=${lastPage}&limit=${limit}>; rel="last"`);

    return links.join(', ');
}

@ApiTags('objects')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/objects')
export class ObjectsApiController {
    constructor(
        private readonly objectsService: ObjectsService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {}

    @Get()
    @PublicAccess()
    @ApiOperation({ summary: 'Получить список исторических объектов (с кэшем и ETag)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (>= 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Размер страницы (1-100)' })
    @ApiResponse({ status: 200, description: 'Список объектов с пагинацией', type: PaginatedObjectResponseDto })
    @ApiResponse({ status: 304, description: 'Not Modified — данные не изменились (ETag совпал)' })
    @ApiHeader({ name: 'Link', description: 'Ссылки на страницы пагинации (HATEOAS)', required: false })
    @ApiHeader({ name: 'ETag', description: 'Хеш содержимого для условных запросов', required: false })
    @ApiHeader({ name: 'Cache-Control', description: 'Директивы кэширования на клиенте', required: false })
    async findAll(
        @Query('page') pageRaw?: string,
        @Query('limit') limitRaw?: string,
        @Req() req?: Request,
        @Res({ passthrough: true }) res?: Response,
    ): Promise<PaginatedObjectResponseDto | void> {
        const page = Math.max(1, Number(pageRaw) || 1);
        const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));
        const cacheKey = `objects:list:${page}:${limit}`;

        let result: PaginatedObjectResponseDto = await this.cache.get(cacheKey);

        if (!result) {
            const [items, total] = await this.objectsService.findAndCount(page, limit);
            result = { items, total, page, limit };
            await this.cache.set(cacheKey, result, 30_000);
        }

        const etag = `"${crypto.createHash('md5').update(JSON.stringify(result)).digest('hex')}"`;
        const ifNoneMatch = req.headers['if-none-match'];

        if (ifNoneMatch === etag) {
            res.status(HttpStatus.NOT_MODIFIED).end();
            return;
        }

        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=30');
        res.setHeader('Link', buildLinkHeader(req.path, page, limit, result.total));

        return result;
    }

    @Get(':id')
    @PublicAccess()
    @ApiOperation({ summary: 'Получить объект по id' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Найден объект', type: ObjectResponseDto })
    @ApiResponse({ status: 404, description: 'Объект не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ObjectResponseDto> {
        return this.objectsService.findOneOrFail(id);
    }

    @Get(':id/facts')
    @PublicAccess()
    @ApiOperation({ summary: 'Получить факты об объекте' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Список фактов об объекте', type: [ObjectFactResponseDto] })
    @ApiResponse({ status: 404, description: 'Объект не найден' })
    async findFacts(@Param('id', ParseIntPipe) id: number): Promise<ObjectFactResponseDto[]> {
        const obj = await this.objectsService.findOneOrFail(id);
        return obj.facts ?? [];
    }

    @Get(':id/periods')
    @PublicAccess()
    @ApiOperation({ summary: 'Получить периоды объекта' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Список периодов объекта', type: [PeriodResponseDto] })
    @ApiResponse({ status: 404, description: 'Объект не найден' })
    async findPeriods(@Param('id', ParseIntPipe) id: number): Promise<PeriodResponseDto[]> {
        const obj = await this.objectsService.findOneOrFail(id);
        return obj.periods ?? [];
    }

    @Post()
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Создать новый исторический объект (admin)' })
    @ApiBody({ type: CreateObjectDto })
    @ApiResponse({ status: 201, description: 'Объект создан', type: ObjectResponseDto })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async create(@Body() dto: CreateObjectDto): Promise<ObjectResponseDto> {
        return this.objectsService.create(dto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Обновить объект (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdateObjectDto })
    @ApiResponse({ status: 200, description: 'Объект обновлён', type: ObjectResponseDto })
    @ApiResponse({ status: 404, description: 'Объект не найден' })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateObjectDto): Promise<ObjectResponseDto> {
        return this.objectsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Удалить объект (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Объект удалён' })
    @ApiResponse({ status: 404, description: 'Объект не найден' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.objectsService.remove(id);
    }
}
