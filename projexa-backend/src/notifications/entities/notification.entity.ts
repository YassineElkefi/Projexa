import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  /** The user who receives the notification */
  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Short human-readable message */
  @Column({ type: 'varchar', length: 512 })
  message: string;

  /** Discriminator to let the UI route/icon appropriately */
  @Column({ type: 'varchar', length: 64 })
  type: string; // e.g. 'project_assigned' | 'member_added' | 'task_updated' | 'status_updated'

  /** Optional JSON payload (project id, task id, etc.) */
  @Column({ type: 'json', nullable: true })
  payload: Record<string, any> | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
