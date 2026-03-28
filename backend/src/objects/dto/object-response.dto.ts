import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { PeriodResponseDto } from '../../periods/dto/period-response.dto';

export class ObjectFactResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    text: string;
}

export class ObjectResponseDto {
    @ApiProperty({ description: 'ID объекта' })
    id: number;

    @ApiProperty({ description: 'Название объекта' })
    title: string;

    @ApiProperty({ description: 'Год создания' })
    year: number;

    @ApiPropertyOptional({ description: 'URL изображения' })
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'alt-текст изображения' })
    imageAlt?: string;

    @ApiPropertyOptional({ description: 'Подпись к изображению' })
    imageCaption?: string;

    @ApiPropertyOptional({ description: 'Описание объекта' })
    description?: string;

    @ApiProperty({ description: 'Дата создания' })
    createdAt: Date;

    @ApiPropertyOptional({ type: () => CategoryResponseDto })
    category?: CategoryResponseDto;

    @ApiPropertyOptional({ type: [ObjectFactResponseDto] })
    facts?: ObjectFactResponseDto[];

    @ApiPropertyOptional({ type: [PeriodResponseDto] })
    periods?: PeriodResponseDto[];
}

export class PaginatedObjectResponseDto {
    @ApiProperty({ type: [ObjectResponseDto] })
    items: ObjectResponseDto[];

    @ApiProperty({ description: 'Общее количество записей' })
    total: number;

    @ApiProperty({ description: 'Текущая страница' })
    page: number;

    @ApiProperty({ description: 'Размер страницы' })
    limit: number;
}
