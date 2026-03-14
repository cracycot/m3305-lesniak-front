import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ObjectFact } from './object-fact.entity';
import { Period } from '../../periods/entities/period.entity';

@Entity()
export class HistoricalObject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    year: number;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    imageAlt: string;

    @Column({ nullable: true })
    imageCaption: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Category, (cat) => cat.objects, { nullable: true, eager: false, onDelete: 'SET NULL' })
    category: Category;

    @OneToMany(() => ObjectFact, (fact) => fact.object, { cascade: true, eager: true })
    facts: ObjectFact[];

    @ManyToMany(() => Period, (period) => period.objects, { eager: false })
    @JoinTable({ name: 'object_period' })
    periods: Period[];

    @CreateDateColumn()
    createdAt: Date;
}
