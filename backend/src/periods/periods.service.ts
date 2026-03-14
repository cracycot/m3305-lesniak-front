import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Period } from './entities/period.entity';
import { CreatePeriodDto } from './dto/create-period.dto';

@Injectable()
export class PeriodsService {
    constructor(
        @InjectRepository(Period)
        private readonly repo: Repository<Period>,
    ) {}

    findAll(): Promise<Period[]> {
        return this.repo.find({ order: { startYear: 'ASC' } });
    }

    findOne(id: number): Promise<Period | null> {
        return this.repo.findOneBy({ id });
    }

    create(dto: CreatePeriodDto): Promise<Period> {
        const period = this.repo.create(dto);
        return this.repo.save(period);
    }

    async update(id: number, dto: Partial<CreatePeriodDto>): Promise<Period> {
        const period = await this.repo.findOneByOrFail({ id });
        Object.assign(period, dto);
        return this.repo.save(period);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}
