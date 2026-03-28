import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ObjectsService } from '../../objects/objects.service';
import { CategoriesService } from '../../categories/categories.service';
import { PeriodsService } from '../../periods/periods.service';
import { HistoricalObjectType, PaginatedHistoricalObjectType } from '../types/historical-object.type';
import { CategoryType } from '../types/category.type';
import { ObjectFactType } from '../types/object-fact.type';
import { PeriodType } from '../types/period.type';
import { CreateHistoricalObjectInput, UpdateHistoricalObjectInput } from '../inputs/historical-object.input';
import { HistoricalObject } from '../../objects/entities/historical-object.entity';

@Resolver(() => HistoricalObjectType)
export class ObjectsResolver {
    constructor(
        private readonly objectsService: ObjectsService,
        private readonly categoriesService: CategoriesService,
        private readonly periodsService: PeriodsService,
    ) {}

    @Query(() => PaginatedHistoricalObjectType, { description: 'Получить список исторических объектов с пагинацией' })
    async objects(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы (>= 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 20, description: 'Размер страницы (1-100)' }) limit: number,
    ): Promise<PaginatedHistoricalObjectType> {
        const p = Math.max(1, page);
        const l = Math.min(100, Math.max(1, limit));
        const [items, total] = await this.objectsService.findAndCount(p, l);
        return { items: items as unknown as HistoricalObjectType[], total, page: p, limit: l };
    }

    @Query(() => HistoricalObjectType, { nullable: true, description: 'Получить исторический объект по ID' })
    async object(
        @Args('id', { type: () => Int, description: 'ID объекта' }) id: number,
    ): Promise<HistoricalObjectType | null> {
        return this.objectsService.findOne(id) as unknown as HistoricalObjectType;
    }

    @Mutation(() => HistoricalObjectType, { description: 'Создать новый исторический объект' })
    async createObject(
        @Args('input', { description: 'Данные нового объекта' }) input: CreateHistoricalObjectInput,
    ): Promise<HistoricalObjectType> {
        const created = await this.objectsService.create(input);
        return created as unknown as HistoricalObjectType;
    }

    @Mutation(() => HistoricalObjectType, { description: 'Обновить исторический объект по ID' })
    async updateObject(
        @Args('id', { type: () => Int, description: 'ID объекта' }) id: number,
        @Args('input', { description: 'Обновлённые данные объекта' }) input: UpdateHistoricalObjectInput,
    ): Promise<HistoricalObjectType> {
        const updated = await this.objectsService.update(id, input);
        return updated as unknown as HistoricalObjectType;
    }

    @Mutation(() => Boolean, { description: 'Удалить исторический объект по ID' })
    async removeObject(
        @Args('id', { type: () => Int, description: 'ID объекта' }) id: number,
    ): Promise<boolean> {
        await this.objectsService.remove(id);
        return true;
    }

    @ResolveField(() => CategoryType, { nullable: true, description: 'Категория объекта' })
    async category(@Parent() obj: HistoricalObject): Promise<CategoryType | null> {
        if (obj.category) return obj.category as unknown as CategoryType;
        return null;
    }

    @ResolveField(() => [ObjectFactType], { nullable: true, description: 'Факты об объекте' })
    async facts(@Parent() obj: HistoricalObject): Promise<ObjectFactType[]> {
        return (obj.facts ?? []) as unknown as ObjectFactType[];
    }

    @ResolveField(() => [PeriodType], { nullable: true, description: 'Связанные исторические периоды' })
    async periods(@Parent() obj: HistoricalObject): Promise<PeriodType[]> {
        if (obj.periods) return obj.periods as unknown as PeriodType[];
        const full = await this.objectsService.findOne(obj.id);
        return (full?.periods ?? []) as unknown as PeriodType[];
    }
}
