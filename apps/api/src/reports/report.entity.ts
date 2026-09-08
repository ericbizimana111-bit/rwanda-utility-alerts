import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Location, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column()
    locationId: string;

    @ManyToOne(() => Utility, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilityId' })
    utility: Utility;

    @Column()
    utilityId: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', default: 'pending' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}