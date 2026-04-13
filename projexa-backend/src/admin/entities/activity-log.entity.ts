import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type ActivityType =
  | 'user_registered'
  | 'user_banned'
  | 'user_unbanned'
  | 'user_activated'
  | 'role_changed'
  | 'project_created'
  | 'settings_changed';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: [
      'user_registered',
      'user_banned',
      'user_unbanned',
      'user_activated',
      'role_changed',
      'project_created',
      'settings_changed',
    ],
  })
  type: ActivityType;

  @Column()
  message: string;

  @Column()
  actor: string;

  @CreateDateColumn()
  timestamp: Date;
}