import { Injectable, NotFoundException } from '@nestjs/common';
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

    async findAndCount(page: number, limit: number): Promise<[Category[], number]> {
        const [items, total] = await this.repo.findAndCount({
            order: { name: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return [items, total];
    }

    findOne(id: number): Promise<Category | null> {
        return this.repo.findOneBy({ id });
    }

    async findOneOrFail(id: number): Promise<Category> {
        const category = await this.findOne(id);
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
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
