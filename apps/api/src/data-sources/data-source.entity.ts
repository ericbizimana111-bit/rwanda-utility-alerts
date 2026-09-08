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

    @Column({ nullable: true })
    lastCheckedAt: Date;

    @Column({ nullable: true })
    lastSuccessfulCheckAt: Date;

    @Column({ nullable: true })
    lastError: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}