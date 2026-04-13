import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';
import { Role } from '../../users/enums/role.enum';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Nexus' })
  appName: string;

  @Column({ default: true })
  allowRegistration: boolean;

  @Column({ default: false })
  maintenanceMode: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  defaultUserRole: Role;

  @Column({ default: 10 })
  maxProjectsPerTeam: number;

  @Column({ default: true })
  emailNotificationsEnabled: boolean;

  @Column({ nullable: true })
  supportEmail: string;

  @UpdateDateColumn()
  updatedAt: Date;
}