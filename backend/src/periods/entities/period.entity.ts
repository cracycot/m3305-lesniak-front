import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HistoricalObject } from '../../objects/entities/historical-object.entity';

@Entity()
export class Period {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    startYear: number;

    @Column({ nullable: true })
    endYear: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToMany(() => HistoricalObject, (obj) => obj.periods)
    objects: HistoricalObject[];
}
