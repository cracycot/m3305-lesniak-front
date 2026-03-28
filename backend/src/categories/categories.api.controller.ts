import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Patch,
    Delete,
    Query,
    ParseIntPipe,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto, PaginatedCategoryResponseDto } from './dto/category-response.dto';

function buildLinkHeader(basePath: string, page: number, limit: number, total: number): string | undefined {
    const links: string[] = [];
    const lastPage = Math.max(1, Math.ceil(total / limit));

    links.push(`<${basePath}?page=1&limit=${limit}>; rel="first"`);
    if (page > 1) links.push(`<${basePath}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    if (page < lastPage) links.push(`<${basePath}?page=${page + 1}&limit=${limit}>; rel="next"`);
    links.push(`<${basePath}?page=${lastPage}&limit=${limit}>; rel="last"`);

    return links.join(', ');
}

@ApiTags('categories')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/categories')
export class CategoriesApiController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Get()
    @PublicAccess()
    @ApiOperation({ summary: 'Получить список категорий' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (>= 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Размер страницы (1-100)' })
    @ApiResponse({ status: 200, description: 'Список категорий с пагинацией', type: PaginatedCategoryResponseDto })
    @ApiHeader({ name: 'Link', description: 'Ссылки на страницы пагинации (HATEOAS)', required: false })
    async findAll(
        @Query('page') pageRaw?: string,
        @Query('limit') limitRaw?: string,
        @Req() req?: Request,
        @Res({ passthrough: true }) res?: Response,
    ): Promise<PaginatedCategoryResponseDto> {
        const page = Math.max(1, Number(pageRaw) || 1);
        const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));

        const [items, total] = await this.categoriesService.findAndCount(page, limit);

        const linkHeader = buildLinkHeader(req.path, page, limit, total);
        if (linkHeader) res.setHeader('Link', linkHeader);

        return { items, total, page, limit };
    }

    @Get(':id')
    @PublicAccess()
    @ApiOperation({ summary: 'Получить категорию по id' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Найдена категория', type: CategoryResponseDto })
    @ApiResponse({ status: 404, description: 'Категория не найдена' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponseDto> {
        return this.categoriesService.findOneOrFail(id);
    }

    @Post()
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Создать новую категорию (admin)' })
    @ApiBody({ type: CreateCategoryDto })
    @ApiResponse({ status: 201, description: 'Категория создана', type: CategoryResponseDto })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    @ApiResponse({ status: 409, description: 'Категория с таким именем уже существует' })
    async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoriesService.create(dto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Обновить категорию (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdateCategoryDto })
    @ApiResponse({ status: 200, description: 'Категория обновлена', type: CategoryResponseDto })
    @ApiResponse({ status: 404, description: 'Категория не найдена' })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
        return this.categoriesService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Удалить категорию (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Категория удалена' })
    @ApiResponse({ status: 404, description: 'Категория не найдена' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.categoriesService.remove(id);
    }
}
