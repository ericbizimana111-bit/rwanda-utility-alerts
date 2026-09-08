import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import type { Utility } from '../utilities/utility.entity';
import type { Location } from '../locations/location.entity';
import type { OutageLocation } from './outage-location.entity';

@Entity('outages')
@Index(['utilityId'])
@Index(['startTime'])
@Index(['endTime'])
@Index(['status'])
@Index(['externalId'], { unique: true })
export class Outage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @ManyToOne('Utility', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilityId' })
    utility: Utility;

    @Column()
    utilityId: string;

    @ManyToOne('Location', { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'locationId' })
    location: Location | null;

    @Column({ type: 'uuid', nullable: true })
    locationId: string | null;

    @OneToMany('OutageLocation', (outageLocation: OutageLocation) => outageLocation.outage)
    outageLocations: OutageLocation[];

    @Column({ type: 'timestamp', nullable: true })
    startTime: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date | null;

    @Column({ type: 'varchar', default: 'planned' })
    status: string;

    @Column({ type: 'varchar', default: 'official' })
    sourceType: string;

    @Column({ type: 'varchar', nullable: true })
    sourceName: string | null;

    @Column({ type: 'varchar', nullable: true })
    sourceUrl: string | null;

    @Column({ unique: true })
    externalId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}