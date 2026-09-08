import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { OutageLocation } from '../outages/outage-location.entity';

@Entity('locations')
@Index(['province'])
@Index(['district'])
@Index(['sector'])
@Index(['cell'])
@Index(['village'])
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    province: string;

    @Column()
    district: string;

    @Column({ type: 'varchar', nullable: true })
    sector: string | null;

    @Column({ type: 'varchar', nullable: true })
    cell: string | null;

    @Column({ type: 'varchar', nullable: true })
    village: string | null;

    @OneToMany(() => OutageLocation, (outageLocation) => outageLocation.location)
    outageLocations: OutageLocation[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}