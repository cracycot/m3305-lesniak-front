import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PeriodsService } from '../../periods/periods.service';
import { PeriodType, PaginatedPeriodType } from '../types/period.type';
import { CreatePeriodInput, UpdatePeriodInput } from '../inputs/period.input';

@Resolver(() => PeriodType)
export class PeriodsResolver {
    constructor(private readonly periodsService: PeriodsService) {}

    @Query(() => PaginatedPeriodType, { description: 'Получить список периодов с пагинацией' })
    async periods(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы (>= 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 20, description: 'Размер страницы (1-100)' }) limit: number,
    ): Promise<PaginatedPeriodType> {
        const p = Math.max(1, page);
        const l = Math.min(100, Math.max(1, limit));
        const [items, total] = await this.periodsService.findAndCount(p, l);
        return { items, total, page: p, limit: l };
    }

    @Query(() => PeriodType, { nullable: true, description: 'Получить период по ID' })
    async period(
        @Args('id', { type: () => Int, description: 'ID периода' }) id: number,
    ): Promise<PeriodType | null> {
        return this.periodsService.findOne(id);
    }

    @Mutation(() => PeriodType, { description: 'Создать новый период' })
    async createPeriod(
        @Args('input', { description: 'Данные нового периода' }) input: CreatePeriodInput,
    ): Promise<PeriodType> {
        return this.periodsService.create(input);
    }

    @Mutation(() => PeriodType, { description: 'Обновить период по ID' })
    async updatePeriod(
        @Args('id', { type: () => Int, description: 'ID периода' }) id: number,
        @Args('input', { description: 'Обновлённые данные периода' }) input: UpdatePeriodInput,
    ): Promise<PeriodType> {
        return this.periodsService.update(id, input);
    }

    @Mutation(() => Boolean, { description: 'Удалить период по ID' })
    async removePeriod(
        @Args('id', { type: () => Int, description: 'ID периода' }) id: number,
    ): Promise<boolean> {
        await this.periodsService.remove(id);
        return true;
    }
}
