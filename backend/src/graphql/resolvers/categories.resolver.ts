import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService } from '../../categories/categories.service';
import { CategoryType, PaginatedCategoryType } from '../types/category.type';
import { CreateCategoryInput, UpdateCategoryInput } from '../inputs/category.input';

@Resolver(() => CategoryType)
export class CategoriesResolver {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Query(() => PaginatedCategoryType, { description: 'Получить список категорий с пагинацией' })
    async categories(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы (>= 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 20, description: 'Размер страницы (1-100)' }) limit: number,
    ): Promise<PaginatedCategoryType> {
        const p = Math.max(1, page);
        const l = Math.min(100, Math.max(1, limit));
        const [items, total] = await this.categoriesService.findAndCount(p, l);
        return { items, total, page: p, limit: l };
    }

    @Query(() => CategoryType, { nullable: true, description: 'Получить категорию по ID' })
    async category(
        @Args('id', { type: () => Int, description: 'ID категории' }) id: number,
    ): Promise<CategoryType | null> {
        return this.categoriesService.findOne(id);
    }

    @Mutation(() => CategoryType, { description: 'Создать новую категорию' })
    async createCategory(
        @Args('input', { description: 'Данные новой категории' }) input: CreateCategoryInput,
    ): Promise<CategoryType> {
        return this.categoriesService.create(input);
    }

    @Mutation(() => CategoryType, { description: 'Обновить категорию по ID' })
    async updateCategory(
        @Args('id', { type: () => Int, description: 'ID категории' }) id: number,
        @Args('input', { description: 'Обновлённые данные категории' }) input: UpdateCategoryInput,
    ): Promise<CategoryType> {
        return this.categoriesService.update(id, input);
    }

    @Mutation(() => Boolean, { description: 'Удалить категорию по ID' })
    async removeCategory(
        @Args('id', { type: () => Int, description: 'ID категории' }) id: number,
    ): Promise<boolean> {
        await this.categoriesService.remove(id);
        return true;
    }
}
