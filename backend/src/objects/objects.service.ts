import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';
import { HistoricalObject } from './entities/historical-object.entity';
import { ObjectFact } from './entities/object-fact.entity';
import { Category } from '../categories/entities/category.entity';
import { Period } from '../periods/entities/period.entity';
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
        @InjectRepository(Period)
        private readonly periodsRepo: Repository<Period>,
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

    // ─── Доменные операции ──────────────────────────────────────────────

    async attachToPeriod(objectId: number, periodId: number): Promise<HistoricalObject> {
        const obj = await this.objectsRepo.findOne({
            where: { id: objectId },
            relations: ['category', 'facts', 'periods'],
        });
        if (!obj) throw new NotFoundException('Object not found');

        const period = await this.periodsRepo.findOneBy({ id: periodId });
        if (!period) throw new NotFoundException('Period not found');

        obj.periods = obj.periods ?? [];
        if (!obj.periods.some((p) => p.id === period.id)) {
            obj.periods.push(period);
            await this.objectsRepo.save(obj);
        }
        return obj;
    }

    async detachFromPeriod(objectId: number, periodId: number): Promise<HistoricalObject> {
        const obj = await this.objectsRepo.findOne({
            where: { id: objectId },
            relations: ['category', 'facts', 'periods'],
        });
        if (!obj) throw new NotFoundException('Object not found');

        obj.periods = (obj.periods ?? []).filter((p) => p.id !== periodId);
        await this.objectsRepo.save(obj);
        return obj;
    }

    async addFact(objectId: number, text: string): Promise<ObjectFact> {
        const obj = await this.objectsRepo.findOneBy({ id: objectId });
        if (!obj) throw new NotFoundException('Object not found');

        const fact = this.factsRepo.create({ text, object: obj });
        return this.factsRepo.save(fact);
    }

    async removeFact(factId: number): Promise<void> {
        const fact = await this.factsRepo.findOneBy({ id: factId });
        if (!fact) throw new NotFoundException('Fact not found');
        await this.factsRepo.delete(factId);
    }

    async assignCategory(objectId: number, categoryId: number): Promise<HistoricalObject> {
        const obj = await this.objectsRepo.findOne({
            where: { id: objectId },
            relations: ['category', 'facts', 'periods'],
        });
        if (!obj) throw new NotFoundException('Object not found');

        const category = await this.categoriesRepo.findOneBy({ id: categoryId });
        if (!category) throw new NotFoundException('Category not found');

        obj.category = category;
        return this.objectsRepo.save(obj);
    }

    async unassignCategory(objectId: number): Promise<HistoricalObject> {
        const obj = await this.objectsRepo.findOne({
            where: { id: objectId },
            relations: ['category', 'facts', 'periods'],
        });
        if (!obj) throw new NotFoundException('Object not found');

        obj.category = null;
        return this.objectsRepo.save(obj);
    }
}
