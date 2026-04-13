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

@Entity('project_categories')
export class ProjectCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, p => p.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  name: string;

  @Column({ nullable: true, length: 32, type:"varchar" })
  color: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => Task, t => t.category)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
