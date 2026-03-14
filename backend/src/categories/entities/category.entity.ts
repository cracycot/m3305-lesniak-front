import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HistoricalObject } from '../../objects/entities/historical-object.entity';

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => HistoricalObject, (obj) => obj.category)
    objects: HistoricalObject[];
}
