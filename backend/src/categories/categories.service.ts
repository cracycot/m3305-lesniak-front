import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly repo: Repository<Category>,
    ) {}

    findAll(): Promise<Category[]> {
        return this.repo.find({ order: { name: 'ASC' } });
    }

    findOne(id: number): Promise<Category | null> {
        return this.repo.findOneBy({ id });
    }

    create(dto: CreateCategoryDto): Promise<Category> {
        const category = this.repo.create(dto);
        return this.repo.save(category);
    }

    async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.repo.findOneByOrFail({ id });
        Object.assign(category, dto);
        return this.repo.save(category);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}
