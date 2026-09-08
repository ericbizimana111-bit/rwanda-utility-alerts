import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import type { Outage } from './outage.entity';
import type { Location } from '../locations/location.entity';

@Entity('outage_locations')
@Index(['outageId'])
@Index(['locationId'])
export class OutageLocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne('Outage', (outage: Outage) => outage.outageLocations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'outageId' })
    outage: Outage;

    @Column()
    outageId: string;

    @ManyToOne('Location', (location: Location) => location.outageLocations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column()
    locationId: string;

    @CreateDateColumn()
    createdAt: Date;
}
