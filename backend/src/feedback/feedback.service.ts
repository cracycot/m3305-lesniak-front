import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
    constructor(
        @InjectRepository(Feedback)
        private readonly repo: Repository<Feedback>,
    ) {}

    findAll(): Promise<Feedback[]> {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }

    async findAndCount(page: number, limit: number): Promise<[Feedback[], number]> {
        const [items, total] = await this.repo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return [items, total];
    }

    async findOne(id: number): Promise<Feedback | null> {
        return this.repo.findOneBy({ id });
    }

    async findOneOrFail(id: number): Promise<Feedback> {
        const feedback = await this.findOne(id);
        if (!feedback) {
            throw new NotFoundException('Feedback not found');
        }
        return feedback;
    }

    create(dto: CreateFeedbackDto): Promise<Feedback> {
        const feedback = this.repo.create(dto);
        return this.repo.save(feedback);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}
