import { Injectable } from '@nestjs/common';
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

    create(dto: CreateFeedbackDto): Promise<Feedback> {
        const feedback = this.repo.create(dto);
        return this.repo.save(feedback);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}
