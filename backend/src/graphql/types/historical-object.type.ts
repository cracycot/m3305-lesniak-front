import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CategoryType } from './category.type';
import { ObjectFactType } from './object-fact.type';
import { PeriodType } from './period.type';

@ObjectType({ description: 'Исторический объект послевоенного Ленинграда' })
export class HistoricalObjectType {
    @Field(() => Int, { description: 'Уникальный идентификатор объекта' })
    id: number;

    @Field({ description: 'Название объекта' })
    title: string;

    @Field(() => Int, { description: 'Год создания' })
    year: number;

    @Field({ nullable: true, description: 'URL изображения' })
    imageUrl?: string;

    @Field({ nullable: true, description: 'alt-текст изображения' })
    imageAlt?: string;

    @Field({ nullable: true, description: 'Подпись к изображению' })
    imageCaption?: string;

    @Field({ nullable: true, description: 'Описание объекта' })
    description?: string;

    @Field({ description: 'Дата создания записи' })
    createdAt: Date;

    @Field(() => CategoryType, { nullable: true, description: 'Категория объекта' })
    category?: CategoryType;

    @Field(() => [ObjectFactType], { nullable: true, description: 'Факты об объекте' })
    facts?: ObjectFactType[];

    @Field(() => [PeriodType], { nullable: true, description: 'Связанные периоды' })
    periods?: PeriodType[];
}

@ObjectType({ description: 'Пагинированный список исторических объектов' })
export class PaginatedHistoricalObjectType {
    @Field(() => [HistoricalObjectType], { description: 'Элементы на текущей странице' })
    items: HistoricalObjectType[];

    @Field(() => Int, { description: 'Общее количество записей' })
    total: number;

    @Field(() => Int, { description: 'Текущая страница' })
    page: number;

    @Field(() => Int, { description: 'Размер страницы' })
    limit: number;
}
