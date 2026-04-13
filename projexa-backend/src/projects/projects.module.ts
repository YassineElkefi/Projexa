import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { ProjectStatus } from './entities/project-status.entity';
import { StatusTransition } from './entities/status-transition.entity';
import { Task } from './entities/task.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TaskTypeDataMigrationService } from './task-type-data-migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      ProjectCategory,
      ProjectStatus,
      StatusTransition,
      Task,
    ]),
    UsersModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, TaskTypeDataMigrationService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
