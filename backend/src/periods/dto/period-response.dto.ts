import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodResponseDto {
    @ApiProperty({ description: 'ID периода' })
    id: number;

    @ApiProperty({ description: 'Название периода' })
    name: string;

    @ApiPropertyOptional({ description: 'Год начала периода' })
    startYear?: number;

    @ApiPropertyOptional({ description: 'Год окончания периода' })
    endYear?: number;

    @ApiPropertyOptional({ description: 'Описание периода' })
    description?: string;
}

export class PaginatedPeriodResponseDto {
    @ApiProperty({ type: [PeriodResponseDto] })
    items: PeriodResponseDto[];

    @ApiProperty({ description: 'Общее количество записей' })
    total: number;

    @ApiProperty({ description: 'Текущая страница' })
    page: number;

    @ApiProperty({ description: 'Размер страницы' })
    limit: number;
}
