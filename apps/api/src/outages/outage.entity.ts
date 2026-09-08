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
import { Utility } from '../utilities/utility.entity';
import { Location } from '../locations/location.entity';
import { OutageLocation } from './outage-location.entity';

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

    @ManyToOne(() => Utility, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilityId' })
    utility: Utility;

    @Column()
    utilityId: string;

    @ManyToOne(() => Location, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'locationId' })
    location: Location | null;

    @Column({ nullable: true })
    locationId: string | null;

    @OneToMany(() => OutageLocation, (outageLocation) => outageLocation.outage)
    outageLocations: OutageLocation[];

    @Column({ type: 'timestamp', nullable: true })
    startTime: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date | null;

    @Column({ default: 'planned' })
    status: string;

    @Column({ default: 'official' })
    sourceType: string;

    @Column({ nullable: true })
    sourceName: string | null;

    @Column({ nullable: true })
    sourceUrl: string | null;

    @Column({ unique: true })
    externalId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}