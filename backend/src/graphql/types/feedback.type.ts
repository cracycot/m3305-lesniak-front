import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Отзыв пользователя' })
export class FeedbackType {
    @Field(() => Int, { description: 'Уникальный идентификатор отзыва' })
    id: number;

    @Field({ description: 'Имя автора отзыва' })
    name: string;

    @Field({ description: 'Email автора отзыва' })
    email: string;

    @Field({ description: 'Текст сообщения' })
    message: string;

    @Field({ description: 'Дата создания' })
    createdAt: Date;
}

@ObjectType({ description: 'Пагинированный список отзывов' })
export class PaginatedFeedbackType {
    @Field(() => [FeedbackType], { description: 'Элементы на текущей странице' })
    items: FeedbackType[];

    @Field(() => Int, { description: 'Общее количество записей' })
    total: number;

    @Field(() => Int, { description: 'Текущая страница' })
    page: number;

    @Field(() => Int, { description: 'Размер страницы' })
    limit: number;
}
