import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import type { User } from '../users/user.entity';
import type { Outage } from '../outages/outage.entity';

@Entity('notifications')
@Index(['userId', 'outageId'], { unique: true })
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne('User', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne('Outage', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outageId' })
    outage: Outage;

    @Column()
    outageId: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ type: 'varchar', default: 'queued' })
    status: string;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}