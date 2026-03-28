import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
    @ApiProperty({ description: 'ID категории' })
    id: number;

    @ApiProperty({ description: 'Название категории' })
    name: string;

    @ApiPropertyOptional({ description: 'Описание категории' })
    description?: string;
}

export class PaginatedCategoryResponseDto {
    @ApiProperty({ type: [CategoryResponseDto] })
    items: CategoryResponseDto[];

    @ApiProperty({ description: 'Общее количество записей' })
    total: number;

    @ApiProperty({ description: 'Текущая страница' })
    page: number;

    @ApiProperty({ description: 'Размер страницы' })
    limit: number;
}
