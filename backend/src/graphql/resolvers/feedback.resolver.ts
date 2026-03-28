import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FeedbackService } from '../../feedback/feedback.service';
import { FeedbackType, PaginatedFeedbackType } from '../types/feedback.type';
import { CreateFeedbackInput } from '../inputs/feedback.input';

@Resolver(() => FeedbackType)
export class FeedbackResolver {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Query(() => PaginatedFeedbackType, { description: 'Получить список отзывов с пагинацией' })
    async feedbacks(
        @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы (>= 1)' }) page: number,
        @Args('limit', { type: () => Int, defaultValue: 20, description: 'Размер страницы (1-100)' }) limit: number,
    ): Promise<PaginatedFeedbackType> {
        const p = Math.max(1, page);
        const l = Math.min(100, Math.max(1, limit));
        const [items, total] = await this.feedbackService.findAndCount(p, l);
        return { items, total, page: p, limit: l };
    }

    @Query(() => FeedbackType, { nullable: true, description: 'Получить отзыв по ID' })
    async feedback(
        @Args('id', { type: () => Int, description: 'ID отзыва' }) id: number,
    ): Promise<FeedbackType | null> {
        return this.feedbackService.findOne(id);
    }

    @Mutation(() => FeedbackType, { description: 'Создать новый отзыв' })
    async createFeedback(
        @Args('input', { description: 'Данные нового отзыва' }) input: CreateFeedbackInput,
    ): Promise<FeedbackType> {
        return this.feedbackService.create(input);
    }

    @Mutation(() => Boolean, { description: 'Удалить отзыв по ID' })
    async removeFeedback(
        @Args('id', { type: () => Int, description: 'ID отзыва' }) id: number,
    ): Promise<boolean> {
        await this.feedbackService.remove(id);
        return true;
    }
}
