import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Исторический период' })
export class PeriodType {
    @Field(() => Int, { description: 'Уникальный идентификатор периода' })
    id: number;

    @Field({ description: 'Название периода' })
    name: string;

    @Field(() => Int, { nullable: true, description: 'Начальный год' })
    startYear?: number;

    @Field(() => Int, { nullable: true, description: 'Конечный год' })
    endYear?: number;

    @Field({ nullable: true, description: 'Описание периода' })
    description?: string;
}

@ObjectType({ description: 'Пагинированный список периодов' })
export class PaginatedPeriodType {
    @Field(() => [PeriodType], { description: 'Элементы на текущей странице' })
    items: PeriodType[];

    @Field(() => Int, { description: 'Общее количество записей' })
    total: number;

    @Field(() => Int, { description: 'Текущая страница' })
    page: number;

    @Field(() => Int, { description: 'Размер страницы' })
    limit: number;
}
