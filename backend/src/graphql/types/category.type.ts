import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Категория исторических объектов' })
export class CategoryType {
    @Field(() => Int, { description: 'Уникальный идентификатор категории' })
    id: number;

    @Field({ description: 'Название категории' })
    name: string;

    @Field({ nullable: true, description: 'Описание категории' })
    description?: string;
}

@ObjectType({ description: 'Пагинированный список категорий' })
export class PaginatedCategoryType {
    @Field(() => [CategoryType], { description: 'Элементы на текущей странице' })
    items: CategoryType[];

    @Field(() => Int, { description: 'Общее количество записей' })
    total: number;

    @Field(() => Int, { description: 'Текущая страница' })
    page: number;

    @Field(() => Int, { description: 'Размер страницы' })
    limit: number;
}
