import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ReplaceStatusTransitionsDto } from './dto/replace-status-transitions.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AdminService } from '../admin/admin.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ──────────────────────────── PROJECTS ────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const actor = req.user as any;
    const project = await this.projectsService.create(actor, dto);

    await this.adminService.logActivity({
      type: 'project_created',
      message: `Project "${project.name}" was created`,
      actor: `${actor.firstName} ${actor.lastName}`,
    });

    // Notify the assigned team lead
    if (dto.teamLeadId && dto.teamLeadId !== actor.id) {
      await this.notificationsService.notify({
        userId: dto.teamLeadId,
        type: 'project_assigned',
        message: `You have been assigned as team lead for project "${project.name}"`,
        payload: { projectId: project.id },
      });
    }

    return project;
  }

  @Get()
  list(@Req() req: Request) {
    return this.projectsService.listForUser(req.user as any);
  }

  @Get(':projectId/detail')
  detail(@Req() req: Request, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.getDetail(req.user as any, projectId);
  }

  @Patch(':projectId')
  async update(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    const actor = req.user as any;
    const result = await this.projectsService.update(actor, projectId, dto);

    // Notify new team lead if changed
    if (dto.teamLeadId && dto.teamLeadId !== actor.id) {
      await this.notificationsService.notify({
        userId: dto.teamLeadId,
        type: 'project_assigned',
        message: `You are now the team lead for project "${result.name}"`,
        payload: { projectId },
      });
    }

    return result;
  }

  // ──────────────────────────── MEMBERS ────────────────────────────

  @Get(':projectId/members/assignable')
  assignable(@Req() req: Request, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.listAssignableUsers(req.user as any, projectId);
  }

  @Post(':projectId/members')
  async addMember(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: AddProjectMemberDto,
  ) {
    if (dto.userId == null && (dto.email == null || dto.email.trim() === '')) {
      throw new BadRequestException('Provide userId or email');
    }
    const actor = req.user as any;
    const result = await this.projectsService.addMember(actor, projectId, dto);

    // Resolve the actual userId that was added
    const addedUserId = dto.userId ?? result.members.find(
      (m: any) => m.user?.email === dto.email?.trim().toLowerCase(),
    )?.userId;

    if (addedUserId && addedUserId !== actor.id) {
      await this.notificationsService.notify({
        userId: addedUserId,
        type: 'member_added',
        message: `You were added to project "${result.project.name}"`,
        payload: { projectId },
      });
    }

    return result;
  }

  @Delete(':projectId/members/:userId')
  async removeMember(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const actor = req.user as any;
    const result = await this.projectsService.removeMember(actor, projectId, userId);

    if (userId !== actor.id) {
      await this.notificationsService.notify({
        userId,
        type: 'member_removed',
        message: `You were removed from project "${result.project.name}"`,
        payload: { projectId },
      });
    }

    return result;
  }

  // ──────────────────────────── CATEGORIES ────────────────────────────

  @Post(':projectId/categories')
  createCategory(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.projectsService.createCategory(req.user as any, projectId, dto);
  }

  @Patch(':projectId/categories/:categoryId')
  updateCategory(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.projectsService.updateCategory(req.user as any, projectId, categoryId, dto);
  }

  @Delete(':projectId/categories/:categoryId')
  deleteCategory(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.projectsService.deleteCategory(req.user as any, projectId, categoryId);
  }

  // ──────────────────────────── STATUSES ────────────────────────────

  @Post(':projectId/statuses')
  createStatus(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStatusDto,
  ) {
    return this.projectsService.createStatus(req.user as any, projectId, dto);
  }

  @Patch(':projectId/statuses/:statusId')
  async updateStatus(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('statusId', ParseIntPipe) statusId: number,
    @Body() dto: UpdateStatusDto,
  ) {
    const actor = req.user as any;
    const result = await this.projectsService.updateStatus(actor, projectId, statusId, dto);

    // Notify all project members about the status change
    const memberIds = result.members
      .map((m: any) => m.userId)
      .filter((id: number) => id !== actor.id);

    for (const uid of memberIds) {
      await this.notificationsService.notify({
        userId: uid,
        type: 'status_updated',
        message: `A workflow status was updated in project "${result.project.name}"`,
        payload: { projectId, statusId },
      });
    }

    return result;
  }

  @Delete(':projectId/statuses/:statusId')
  deleteStatus(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('statusId', ParseIntPipe) statusId: number,
  ) {
    return this.projectsService.deleteStatus(req.user as any, projectId, statusId);
  }

  @Put(':projectId/status-transitions')
  replaceTransitions(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: ReplaceStatusTransitionsDto,
  ) {
    return this.projectsService.replaceTransitions(req.user as any, projectId, dto);
  }

  // ──────────────────────────── TASKS ────────────────────────────

  @Get(':projectId/tasks/:taskId')
  getTask(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.projectsService.getTask(req.user as any, projectId, taskId);
  }

  @Get(':projectId/tasks')
  listTasks(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('parentId') parentId?: string,
    @Query('scope') scope?: string,
  ) {
    if (parentId !== undefined && parentId !== '') {
      const p = parseInt(parentId, 10);
      if (!Number.isNaN(p)) {
        return this.projectsService.listTasks(req.user as any, projectId, { parentId: p });
      }
    }
    const all = scope === 'all';
    return this.projectsService.listTasks(req.user as any, projectId, { all });
  }

  @Post(':projectId/tasks')
  async createTask(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateTaskDto,
  ) {
    const actor = req.user as any;
    const task = await this.projectsService.createTask(actor, projectId, dto);

    // Notify assignee if different from creator
    if (task.assigneeId && task.assigneeId !== actor.id) {
      await this.notificationsService.notify({
        userId: task.assigneeId,
        type: 'task_assigned',
        message: `You were assigned to task "${task.title}"`,
        payload: { projectId, taskId: task.id },
      });
    }

    return task;
  }

  @Patch(':projectId/tasks/:taskId')
  async updateTask(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskDto,
  ) {
    const actor = req.user as any;
    const task = await this.projectsService.updateTask(actor, projectId, taskId, dto);

    // Notify new assignee
    if (dto.assigneeId != null && dto.assigneeId !== actor.id) {
      await this.notificationsService.notify({
        userId: dto.assigneeId,
        type: 'task_assigned',
        message: `You were assigned to task "${task.title}"`,
        payload: { projectId, taskId: task.id },
      });
    }

    // Notify assignee when status changes (if they exist and are not the actor)
    if (dto.statusId != null && task.assigneeId && task.assigneeId !== actor.id) {
      await this.notificationsService.notify({
        userId: task.assigneeId,
        type: 'task_status_changed',
        message: `Task "${task.title}" status changed to "${task.status?.name}"`,
        payload: { projectId, taskId: task.id, statusId: task.statusId },
      });
    }

    return task;
  }

  @Delete(':projectId/tasks/:taskId')
  deleteTask(
    @Req() req: Request,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.projectsService.deleteTask(req.user as any, projectId, taskId);
  }
}
