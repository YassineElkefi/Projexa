import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { ProjectStatus } from './project-status.entity';

@Entity('status_transitions')
@Unique(['projectId', 'fromStatusId', 'toStatusId'])
export class StatusTransition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, p => p.statusTransitions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  fromStatusId: number;

  @ManyToOne(() => ProjectStatus, s => s.transitionsFrom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromStatusId' })
  fromStatus: ProjectStatus;

  @Column()
  toStatusId: number;

  @ManyToOne(() => ProjectStatus, s => s.transitionsTo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toStatusId' })
  toStatus: ProjectStatus;
}
