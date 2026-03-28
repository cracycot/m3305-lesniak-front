import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackResponseDto, PaginatedFeedbackResponseDto } from './dto/feedback-response.dto';

function buildLinkHeader(basePath: string, page: number, limit: number, total: number): string {
    const links: string[] = [];
    const lastPage = Math.max(1, Math.ceil(total / limit));

    links.push(`<${basePath}?page=1&limit=${limit}>; rel="first"`);
    if (page > 1) links.push(`<${basePath}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    if (page < lastPage) links.push(`<${basePath}?page=${page + 1}&limit=${limit}>; rel="next"`);
    links.push(`<${basePath}?page=${lastPage}&limit=${limit}>; rel="last"`);

    return links.join(', ');
}

@ApiTags('feedback')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/feedback')
export class FeedbackApiController {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Get()
    @PublicAccess()
    @ApiOperation({ summary: 'Получить список отзывов' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (>= 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Размер страницы (1-100)' })
    @ApiResponse({ status: 200, description: 'Список отзывов с пагинацией', type: PaginatedFeedbackResponseDto })
    @ApiHeader({ name: 'Link', description: 'Ссылки на страницы пагинации (HATEOAS)', required: false })
    async findAll(
        @Query('page') pageRaw?: string,
        @Query('limit') limitRaw?: string,
        @Req() req?: Request,
        @Res({ passthrough: true }) res?: Response,
    ): Promise<PaginatedFeedbackResponseDto> {
        const page = Math.max(1, Number(pageRaw) || 1);
        const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));
        const [items, total] = await this.feedbackService.findAndCount(page, limit);

        res.setHeader('Link', buildLinkHeader(req.path, page, limit, total));

        return { items, total, page, limit };
    }

    @Get(':id')
    @PublicAccess()
    @ApiOperation({ summary: 'Получить отзыв по id' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Найден отзыв', type: FeedbackResponseDto })
    @ApiResponse({ status: 404, description: 'Отзыв не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<FeedbackResponseDto> {
        return this.feedbackService.findOneOrFail(id);
    }

    @Post()
    @PublicAccess()
    @ApiOperation({ summary: 'Создать новый отзыв (доступно всем)' })
    @ApiBody({ type: CreateFeedbackDto })
    @ApiResponse({ status: 201, description: 'Отзыв создан', type: FeedbackResponseDto })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async create(@Body() dto: CreateFeedbackDto): Promise<FeedbackResponseDto> {
        return this.feedbackService.create(dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @Roles('admin')
    @ApiBearerAuth('supertokens')
    @ApiResponse({ status: 401, description: 'Требуется аутентификация' })
    @ApiResponse({ status: 403, description: 'Требуется роль admin' })
    @ApiOperation({ summary: 'Удалить отзыв (admin)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Отзыв удалён' })
    @ApiResponse({ status: 404, description: 'Отзыв не найден' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.feedbackService.remove(id);
    }
}
