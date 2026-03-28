import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';
import { HistoricalObject } from './entities/historical-object.entity';
import { ObjectFact } from './entities/object-fact.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';

@Injectable()
export class ObjectsService {
    private readonly createdSubject = new Subject<HistoricalObject>();
    readonly created$ = this.createdSubject.asObservable();

    constructor(
        @InjectRepository(HistoricalObject)
        private readonly objectsRepo: Repository<HistoricalObject>,
        @InjectRepository(ObjectFact)
        private readonly factsRepo: Repository<ObjectFact>,
        @InjectRepository(Category)
        private readonly categoriesRepo: Repository<Category>,
    ) {}

    findAll(): Promise<HistoricalObject[]> {
        return this.objectsRepo.find({
            relations: ['category', 'facts'],
            order: { createdAt: 'DESC' },
        });
    }

    async findAndCount(page: number, limit: number): Promise<[HistoricalObject[], number]> {
        const [items, total] = await this.objectsRepo.findAndCount({
            relations: ['category', 'facts'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return [items, total];
    }

    findOne(id: number): Promise<HistoricalObject | null> {
        return this.objectsRepo.findOne({
            where: { id },
            relations: ['category', 'facts', 'periods'],
        });
    }

    async findOneOrFail(id: number): Promise<HistoricalObject> {
        const obj = await this.findOne(id);
        if (!obj) {
            throw new NotFoundException('Object not found');
        }
        return obj;
    }

    async create(dto: CreateObjectDto): Promise<HistoricalObject> {
        const obj = this.objectsRepo.create({
            title: dto.title,
            year: dto.year,
            imageUrl: dto.imageUrl,
            imageAlt: dto.imageAlt,
            imageCaption: dto.imageCaption,
            description: dto.description,
        });

        if (dto.categoryId) {
            obj.category = await this.categoriesRepo.findOneBy({ id: dto.categoryId });
        }

        if (dto.facts?.length) {
            obj.facts = dto.facts.map((text) => {
                const fact = new ObjectFact();
                fact.text = text;
                return fact;
            });
        } else {
            obj.facts = [];
        }

        const saved = await this.objectsRepo.save(obj);
        this.createdSubject.next(saved);
        return saved;
    }

    async update(id: number, dto: UpdateObjectDto): Promise<HistoricalObject> {
        const obj = await this.objectsRepo.findOneOrFail({
            where: { id },
            relations: ['category', 'facts'],
        });

        if (dto.title !== undefined) obj.title = dto.title;
        if (dto.year !== undefined) obj.year = dto.year;
        if (dto.imageUrl !== undefined) obj.imageUrl = dto.imageUrl;
        if (dto.imageAlt !== undefined) obj.imageAlt = dto.imageAlt;
        if (dto.imageCaption !== undefined) obj.imageCaption = dto.imageCaption;
        if (dto.description !== undefined) obj.description = dto.description;

        if (dto.categoryId !== undefined) {
            obj.category = dto.categoryId
                ? await this.categoriesRepo.findOneBy({ id: dto.categoryId })
                : null;
        }

        if (dto.facts !== undefined) {
            await this.factsRepo.delete({ object: { id } });
            obj.facts = dto.facts.map((text) => {
                const fact = new ObjectFact();
                fact.text = text;
                return fact;
            });
        }

        return this.objectsRepo.save(obj);
    }

    async remove(id: number): Promise<void> {
        await this.objectsRepo.delete(id);
    }
}
