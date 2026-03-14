import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HistoricalObject } from './historical-object.entity';

@Entity()
export class ObjectFact {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    text: string;

    @ManyToOne(() => HistoricalObject, (obj) => obj.facts, { onDelete: 'CASCADE' })
    object: HistoricalObject;
}
