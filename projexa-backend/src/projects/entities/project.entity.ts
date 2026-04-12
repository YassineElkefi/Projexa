import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectCategory } from './project-category.entity';
import { ProjectStatus } from './project-status.entity';
import { StatusTransition } from './status-transition.entity';
import { Task } from './task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  teamLeadId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teamLeadId' })
  teamLead: User;

  @Column()
  createdById: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => ProjectMember, m => m.project)
  members: ProjectMember[];

  @OneToMany(() => ProjectCategory, c => c.project)
  categories: ProjectCategory[];

  @OneToMany(() => ProjectStatus, s => s.project)
  statuses: ProjectStatus[];

  @OneToMany(() => StatusTransition, t => t.project)
  statusTransitions: StatusTransition[];

  @OneToMany(() => Task, t => t.project)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
