import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    HttpCode,
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
import { RolesGuard } from '../auth/roles.guard';
import { PublicAccess } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { PeriodsService } from './periods.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { PeriodResponseDto, PaginatedPeriodResponseDto } from './dto/period-response.dto';

function buildLinkHeader(basePath: string, page: number, limit: number, total: number): string {
    const links: string[] = [];
    const lastPage = Math.max(1, Math.ceil(total / limit));

    links.push(`<${basePath}?page=1&limit=${limit}>; rel="first"`);
    if (page > 1) links.push(`<${basePath}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    if (page < lastPage) links.push(`<${basePath}?page=${page + 1}&limit=${limit}>; rel="next"`);
    links.push(`<${basePath}?page=${lastPage}&limit=${limit}>; rel="last"`);

    return links.join(', ');
}

@ApiTags('periods')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/periods')
export class PeriodsApiController {
    constructor(private readonly periodsService: PeriodsService) {}

    @Get()
    @PublicAccess()
    @ApiOperation({ summary: 'Получить список периодов' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (>= 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Размер страницы (1-100)' })
    @ApiResponse({ status: 200, description: 'Список периодов с пагинацией', type: PaginatedPeriodResponseDto })
    @ApiHeader({ name: 'Link', description: 'Ссылки на страницы пагинации (HATEOAS)', required: false })
    async findAll(
        @Query('page') pageRaw?: string,
        @Query('limit') limitRaw?: string,
        @Req() req?: Request,
        @Res({ passthrough: true }) res?: Response,
    ): Promise<PaginatedPeriodResponseDto> {
        const page = Math.max(1, Number(pageRaw) || 1);
        const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));
        const [items, total] = await this.periodsService.findAndCount(page, limit);

        res.setHeader('Link', buildLinkHeader(req.path, page, limit, total));

        return { items, total, page, limit };
    }

    @Get(':id')
    @PublicAccess()
    @ApiOperation({ summary: 'Получить период по id' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Найден период', type: PeriodResponseDto })
    @ApiResponse({ status: 404, description: 'Период не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<PeriodResponseDto> {
        return this.periodsService.findOneOrFail(id);
    }

    @Post()
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Создать период (admin)' })
    @ApiBody({ type: CreatePeriodDto })
    @ApiResponse({ status: 201, description: 'Период создан', type: PeriodResponseDto })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async create(@Body() dto: CreatePeriodDto): Promise<PeriodResponseDto> {
        return this.periodsService.create(dto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Обновить период (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdatePeriodDto })
    @ApiResponse({ status: 200, description: 'Период обновлён', type: PeriodResponseDto })
    @ApiResponse({ status: 404, description: 'Период не найден' })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePeriodDto): Promise<PeriodResponseDto> {
        return this.periodsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификація' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Удалить период (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Период удалён' })
    @ApiResponse({ status: 404, description: 'Период не найден' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.periodsService.remove(id);
    }
}
