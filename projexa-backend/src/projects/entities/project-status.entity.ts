import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { StatusTransition } from './status-transition.entity';

@Entity('project_statuses')
export class ProjectStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, p => p.statuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isDefault: boolean;

  /** When true, tasks in this status count as “closed” for reporting. */
  @Column({ default: false })
  isClosed: boolean;

  @OneToMany(() => Task, t => t.status)
  tasks: Task[];

  @OneToMany(() => StatusTransition, st => st.fromStatus)
  transitionsFrom: StatusTransition[];

  @OneToMany(() => StatusTransition, st => st.toStatus)
  transitionsTo: StatusTransition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
