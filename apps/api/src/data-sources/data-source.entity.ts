import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('data_sources')
export class DataSource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column()
    type: string;

    @Column()
    baseUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'timestamp', nullable: true })
    lastCheckedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    lastSuccessfulCheckAt: Date | null;

    @Column({ type: 'text', nullable: true })
    lastError: string | null;

    /** Current/upcoming announcements found in the last successful check. */
    @Column({ type: 'int', nullable: true })
    lastItemCount: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}