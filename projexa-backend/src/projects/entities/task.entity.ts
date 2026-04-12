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
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';
import { ProjectCategory } from './project-category.entity';
import { ProjectStatus } from './project-status.entity';
import { TaskType } from '../enums/task-type.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, p => p.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  parentId: number | null;

  @ManyToOne(() => Task, t => t.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Task | null;

  @OneToMany(() => Task, t => t.parent)
  children: Task[];

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 32, default: TaskType.TICKET })
  type: TaskType;

  @Column()
  statusId: number;

  @ManyToOne(() => ProjectStatus, s => s.tasks, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'statusId' })
  status: ProjectStatus;

  @Column({ nullable: true })
  categoryId: number | null;

  @ManyToOne(() => ProjectCategory, c => c.tasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category: ProjectCategory | null;

  @Column({ nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User | null;

  @Column()
  reporterId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
