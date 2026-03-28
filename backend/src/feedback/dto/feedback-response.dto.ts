import { ApiProperty } from '@nestjs/swagger';

export class FeedbackResponseDto {
    @ApiProperty({ description: 'ID отзыва' })
    id: number;

    @ApiProperty({ description: 'Имя автора' })
    name: string;

    @ApiProperty({ description: 'Email автора' })
    email: string;

    @ApiProperty({ description: 'Текст сообщения' })
    message: string;

    @ApiProperty({ description: 'Дата создания' })
    createdAt: Date;
}

export class PaginatedFeedbackResponseDto {
    @ApiProperty({ type: [FeedbackResponseDto] })
    items: FeedbackResponseDto[];

    @ApiProperty({ description: 'Общее количество записей' })
    total: number;

    @ApiProperty({ description: 'Текущая страница' })
    page: number;

    @ApiProperty({ description: 'Размер страницы' })
    limit: number;
}
