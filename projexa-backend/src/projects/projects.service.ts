import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { ProjectStatus } from './entities/project-status.entity';
import { StatusTransition } from './entities/status-transition.entity';
import { Task } from './entities/task.entity';
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
import { TaskType } from './enums/task-type.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private memberRepo: Repository<ProjectMember>,
    @InjectRepository(ProjectCategory)
    private categoryRepo: Repository<ProjectCategory>,
    @InjectRepository(ProjectStatus)
    private statusRepo: Repository<ProjectStatus>,
    @InjectRepository(StatusTransition)
    private transitionRepo: Repository<StatusTransition>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private usersService: UsersService,
  ) {}

  private async nextCategorySortOrder(projectId: number): Promise<number> {
    const row = await this.categoryRepo
      .createQueryBuilder('c')
      .select('MAX(c.sortOrder)', 'm')
      .where('c.projectId = :projectId', { projectId })
      .getRawOne<{ m: string | null }>();
    const m = row?.m != null ? parseInt(String(row.m), 10) : -1;
    return Number.isFinite(m) ? m + 1 : 0;
  }

  private async nextStatusSortOrder(projectId: number): Promise<number> {
    const row = await this.statusRepo
      .createQueryBuilder('s')
      .select('MAX(s.sortOrder)', 'm')
      .where('s.projectId = :projectId', { projectId })
      .getRawOne<{ m: string | null }>();
    const m = row?.m != null ? parseInt(String(row.m), 10) : -1;
    return Number.isFinite(m) ? m + 1 : 0;
  }

  async countProjects(): Promise<number> {
    return this.projectRepo.count();
  }

  async countOpenTasks(): Promise<number> {
    return this.taskRepo
      .createQueryBuilder('t')
      .innerJoin('t.status', 's')
      .where('s.isClosed = :closed', { closed: false })
      .getCount();
  }

  private async loadProject(projectId: number): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project #${projectId} not found`);
    return project;
  }

  async assertProjectAccess(actor: User, projectId: number): Promise<Project> {
    const project = await this.loadProject(projectId);
    if (actor.role === Role.ADMIN) return project;
    if (project.teamLeadId === actor.id) return project;
    const m = await this.memberRepo.findOne({
      where: { projectId, userId: actor.id },
    });
    if (!m) throw new ForbiddenException('You are not a member of this project');
    return project;
  }

  async assertProjectManage(actor: User, project: Project): Promise<void> {
    if (actor.role === Role.ADMIN) return;
    if (project.teamLeadId === actor.id) return;
    throw new ForbiddenException('Only admins or the team lead can manage this project');
  }

  async assertMemberManage(actor: User, project: Project): Promise<void> {
    if (actor.role === Role.ADMIN) return;
    if (project.teamLeadId === actor.id) return;
    throw new ForbiddenException('Only admins or the team lead can manage members');
  }

  async assertTaskAuthoring(actor: User, project: Project): Promise<void> {
    if (actor.role === Role.ADMIN) return;
    if (project.teamLeadId === actor.id) return;
    throw new ForbiddenException('Only admins or the team lead can create or delete tasks');
  }

  private isProjectTaskManager(actor: User, project: Project): boolean {
    if (actor.role === Role.ADMIN) return true;
    return project.teamLeadId === actor.id;
  }

  private async seedDefaultStatusesAndTransitions(projectId: number): Promise<void> {
    const names = ['New', 'In progress', 'In review', 'Done', 'Closed'];
    const closedFlags = [false, false, false, true, true];
    const statuses: ProjectStatus[] = [];
    for (let i = 0; i < names.length; i++) {
      const s = this.statusRepo.create({
        projectId,
        name: names[i],
        sortOrder: i,
        isDefault: i === 0,
        isClosed: closedFlags[i],
      });
      statuses.push(await this.statusRepo.save(s));
    }
    const edges: { from: number; to: number }[] = [];
    for (let i = 0; i < statuses.length - 1; i++) {
      edges.push({ from: statuses[i].id, to: statuses[i + 1].id });
    }
    for (let i = 1; i < statuses.length; i++) {
      edges.push({ from: statuses[i].id, to: statuses[i - 1].id });
    }
    for (const e of edges) {
      await this.transitionRepo.save(
        this.transitionRepo.create({
          projectId,
          fromStatusId: e.from,
          toStatusId: e.to,
        }),
      );
    }

    await this.categoryRepo.save(
      this.categoryRepo.create({
        projectId,
        name: 'General',
        color: 'rgba(232, 255, 71, 0.35)',
        sortOrder: 0,
      }),
    );
  }

  async create(actor: User, dto: CreateProjectDto): Promise<Project> {
    const lead = await this.usersService.findById(dto.teamLeadId);
    if (!lead) throw new BadRequestException('Team lead user not found');
    if (lead.status === UserStatus.BANNED) {
      throw new BadRequestException('Cannot assign a banned user as team lead');
    }
    if (lead.role !== Role.TEAM_LEAD && lead.role !== Role.ADMIN) {
      throw new BadRequestException('Team lead must be a user with TEAM_LEAD or ADMIN role');
    }

    const project = await this.projectRepo.save(
      this.projectRepo.create({
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        teamLeadId: dto.teamLeadId,
        createdById: actor.id,
      }),
    );

    await this.memberRepo.save(
      this.memberRepo.create({
        projectId: project.id,
        userId: dto.teamLeadId,
        addedById: actor.id,
      }),
    );

    await this.seedDefaultStatusesAndTransitions(project.id);
    return this.loadProject(project.id);
  }

  async listForUser(actor: User): Promise<Project[]> {
    if (actor.role === Role.ADMIN) {
      return this.projectRepo.find({
        order: { updatedAt: 'DESC' },
        relations: { teamLead: true },
      });
    }
    const memberRows = await this.memberRepo.find({
      where: { userId: actor.id },
      select: { projectId: true },
    });
    const ids = [...new Set(memberRows.map(r => r.projectId))];
    if (ids.length === 0) return [];
    return this.projectRepo.find({
      where: { id: In(ids) },
      order: { updatedAt: 'DESC' },
      relations: { teamLead: true },
    });
  }

  async getDetail(actor: User, projectId: number) {
    await this.assertProjectAccess(actor, projectId);
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: { teamLead: true, createdBy: true },
    });
    if (!project) throw new NotFoundException();

    const members = await this.memberRepo.find({
      where: { projectId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    const categories = await this.categoryRepo.find({
      where: { projectId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    const statuses = await this.statusRepo.find({
      where: { projectId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    const transitions = await this.transitionRepo.find({
      where: { projectId },
    });

    return {
      project: this.stripUserSecrets(project),
      members: members.map(m => ({
        id: m.id,
        userId: m.userId,
        createdAt: m.createdAt,
        user: this.pickUser(m.user),
      })),
      categories,
      statuses,
      transitions,
    };
  }

  private pickUser(u: User) {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      avatarUrl: u.avatarUrl,
    };
  }

  private stripUserSecrets(project: Project) {
    const { teamLead, createdBy, ...rest } = project as Project & {
      teamLead?: User;
      createdBy?: User;
    };
    return {
      ...rest,
      teamLead: teamLead ? this.pickUser(teamLead) : undefined,
      createdBy: createdBy ? this.pickUser(createdBy) : undefined,
    };
  }

  async update(actor: User, projectId: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);

    if (dto.teamLeadId != null && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can change the team lead');
    }

    if (dto.teamLeadId != null) {
      const newLead = await this.usersService.findById(dto.teamLeadId);
      if (!newLead) throw new BadRequestException('Team lead user not found');
      if (newLead.status === UserStatus.BANNED) {
        throw new BadRequestException('Cannot assign a banned user as team lead');
      }
      if (newLead.role !== Role.TEAM_LEAD && newLead.role !== Role.ADMIN) {
        throw new BadRequestException('Team lead must be TEAM_LEAD or ADMIN');
      }
      project.teamLeadId = dto.teamLeadId;
      const existing = await this.memberRepo.findOne({
        where: { projectId, userId: dto.teamLeadId },
      });
      if (!existing) {
        await this.memberRepo.save(
          this.memberRepo.create({
            projectId,
            userId: dto.teamLeadId,
            addedById: actor.id,
          }),
        );
      }
    }

    if (dto.name != null) project.name = dto.name.trim();
    if (dto.description !== undefined) {
      project.description = dto.description?.trim() ?? null;
    }

    await this.projectRepo.save(project);
    return this.loadProject(projectId);
  }

  async addMember(actor: User, projectId: number, dto: AddProjectMemberDto) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertMemberManage(actor, project);

    let userId = dto.userId;
    if (dto.email) {
      const u = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
      if (!u) throw new BadRequestException('No user with that email');
      userId = u.id;
    }
    if (userId == null) throw new BadRequestException('Provide userId or email');

    const target = await this.usersService.findById(userId);
    if (!target) throw new BadRequestException('User not found');
    if (target.status === UserStatus.BANNED) {
      throw new BadRequestException('Cannot add a banned user');
    }

    const dup = await this.memberRepo.findOne({ where: { projectId, userId } });
    if (dup) return this.getDetail(actor, projectId);

    await this.memberRepo.save(
      this.memberRepo.create({
        projectId,
        userId,
        addedById: actor.id,
      }),
    );
    return this.getDetail(actor, projectId);
  }

  async removeMember(actor: User, projectId: number, userId: number) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertMemberManage(actor, project);

    if (userId === project.teamLeadId) {
      throw new BadRequestException('Remove or change the team lead before removing this member');
    }

    await this.memberRepo.delete({ projectId, userId });
    return this.getDetail(actor, projectId);
  }

  async createCategory(actor: User, projectId: number, dto: CreateCategoryDto) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);
    const nextOrder = await this.nextCategorySortOrder(projectId);
    const sortOrder = dto.sortOrder ?? nextOrder;
    await this.categoryRepo.save(
      this.categoryRepo.create({
        projectId,
        name: dto.name.trim(),
        color: dto.color ?? null,
        sortOrder,
      }),
    );
    return this.getDetail(actor, projectId);
  }

  async updateCategory(
    actor: User,
    projectId: number,
    categoryId: number,
    dto: UpdateCategoryDto,
  ) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);
    const cat = await this.categoryRepo.findOne({
      where: { id: categoryId, projectId },
    });
    if (!cat) throw new NotFoundException('Category not found');
    if (dto.name != null) cat.name = dto.name.trim();
    if (dto.color !== undefined) cat.color = dto.color;
    if (dto.sortOrder != null) cat.sortOrder = dto.sortOrder;
    await this.categoryRepo.save(cat);
    return this.getDetail(actor, projectId);
  }

  async deleteCategory(actor: User, projectId: number, categoryId: number) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);
    const cat = await this.categoryRepo.findOne({
      where: { id: categoryId, projectId },
    });
    if (!cat) throw new NotFoundException('Category not found');
    await this.categoryRepo.delete(categoryId);
    return this.getDetail(actor, projectId);
  }

  async createStatus(actor: User, projectId: number, dto: CreateStatusDto) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);
    if (dto.isDefault) {
      await this.statusRepo.update({ projectId }, { isDefault: false });
    }
    const nextOrder = await this.nextStatusSortOrder(projectId);
    const sortOrder = dto.sortOrder ?? nextOrder;
    await this.statusRepo.save(
      this.statusRepo.create({
        projectId,
        name: dto.name.trim(),
        sortOrder,
        isDefault: !!dto.isDefault,
        isClosed: !!dto.isClosed,
      }),
    );
    return this.getDetail(actor, projectId);
  }

  async updateStatus(
    actor: User,
    projectId: number,
    statusId: number,
    dto: UpdateStatusDto,
  ) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);
    const st = await this.statusRepo.findOne({
      where: { id: statusId, projectId },
    });
    if (!st) throw new NotFoundException('Status not found');
    if (dto.isDefault) {
      await this.statusRepo.update({ projectId }, { isDefault: false });
    }
    if (dto.name != null) st.name = dto.name.trim();
    if (dto.sortOrder != null) st.sortOrder = dto.sortOrder;
    if (dto.isDefault != null) st.isDefault = dto.isDefault;
    if (dto.isClosed != null) st.isClosed = dto.isClosed;
    await this.statusRepo.save(st);
    return this.getDetail(actor, projectId);
  }

  async deleteStatus(actor: User, projectId: number, statusId: number) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);
    const st = await this.statusRepo.findOne({
      where: { id: statusId, projectId },
    });
    if (!st) throw new NotFoundException('Status not found');
    const count = await this.taskRepo.count({ where: { statusId } });
    if (count > 0) {
      throw new BadRequestException('Cannot delete a status that is in use by tasks');
    }
    await this.transitionRepo
      .createQueryBuilder()
      .delete()
      .where('projectId = :projectId', { projectId })
      .andWhere('(fromStatusId = :sid OR toStatusId = :sid)', { sid: statusId })
      .execute();
    await this.statusRepo.delete(statusId);
    return this.getDetail(actor, projectId);
  }

  async replaceTransitions(
    actor: User,
    projectId: number,
    dto: ReplaceStatusTransitionsDto,
  ) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertProjectManage(actor, project);

    const statusIds = new Set(
      (await this.statusRepo.find({ where: { projectId }, select: { id: true } })).map(
        s => s.id,
      ),
    );

    for (const e of dto.edges) {
      if (!statusIds.has(e.fromStatusId) || !statusIds.has(e.toStatusId)) {
        throw new BadRequestException('Invalid status id in transition');
      }
      if (e.fromStatusId === e.toStatusId) {
        throw new BadRequestException('Self-transitions are not allowed');
      }
    }

    await this.transitionRepo.delete({ projectId });
    for (const e of dto.edges) {
      await this.transitionRepo.save(
        this.transitionRepo.create({
          projectId,
          fromStatusId: e.fromStatusId,
          toStatusId: e.toStatusId,
        }),
      );
    }
    return this.getDetail(actor, projectId);
  }

  private async assertTransitionAllowed(
    projectId: number,
    fromStatusId: number,
    toStatusId: number,
  ): Promise<void> {
    const from = Number(fromStatusId);
    const to = Number(toStatusId);
    if (from === to) return;
    const count = await this.transitionRepo.count({ where: { projectId } });
    if (count === 0) return;
    const ok = await this.transitionRepo.findOne({
      where: {
        projectId,
        fromStatusId: from,
        toStatusId: to,
      },
    });
    if (!ok) {
      throw new BadRequestException(
        'That status change is not allowed by this project workflow',
      );
    }
  }

  private async assertUserIsMember(projectId: number, userId: number) {
    const project = await this.loadProject(projectId);
    if (project.teamLeadId === userId) return;
    const m = await this.memberRepo.findOne({ where: { projectId, userId } });
    if (!m) throw new BadRequestException('Assignee must be a project member');
  }

  async listTasks(
    actor: User,
    projectId: number,
    opts?: { parentId?: number; all?: boolean },
  ) {
    await this.assertProjectAccess(actor, projectId);
    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignee', 'a')
      .leftJoinAndSelect('t.reporter', 'r')
      .leftJoinAndSelect('t.status', 's')
      .leftJoinAndSelect('t.category', 'c')
      .where('t.projectId = :projectId', { projectId })
      .orderBy('t.sortOrder', 'ASC')
      .addOrderBy('t.id', 'ASC');

    if (opts?.all) {
      // no parent filter
    } else if (opts?.parentId != null) {
      qb.andWhere('t.parentId = :parentId', { parentId: opts.parentId });
    } else {
      qb.andWhere('t.parentId IS NULL');
    }

    const tasks = await qb.getMany();
    return tasks.map(t => this.serializeTask(t));
  }

  private serializeTask(t: Task) {
    return {
      id: t.id,
      projectId: t.projectId,
      parentId: t.parentId,
      title: t.title,
      description: t.description,
      type: t.type,
      statusId: t.statusId,
      categoryId: t.categoryId,
      assigneeId: t.assigneeId,
      reporterId: t.reporterId,
      sortOrder: t.sortOrder,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      status: t.status
        ? { id: t.status.id, name: t.status.name, isClosed: t.status.isClosed }
        : undefined,
      category: t.category
        ? { id: t.category.id, name: t.category.name, color: t.category.color }
        : null,
      assignee: t.assignee ? this.pickUser(t.assignee) : null,
      reporter: t.reporter ? this.pickUser(t.reporter) : undefined,
    };
  }

  async createTask(actor: User, projectId: number, dto: CreateTaskDto) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertTaskAuthoring(actor, project);

    const st = await this.statusRepo.findOne({
      where: { id: dto.statusId, projectId },
    });
    if (!st) throw new BadRequestException('Invalid status for this project');

    let parentId: number | null = dto.parentId ?? null;
    if (parentId != null) {
      const parent = await this.taskRepo.findOne({
        where: { id: parentId, projectId },
      });
      if (!parent) throw new BadRequestException('Parent task not found in this project');
    }

    if (dto.assigneeId != null) {
      await this.assertUserIsMember(projectId, dto.assigneeId);
    }

    if (dto.categoryId != null) {
      const cat = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, projectId },
      });
      if (!cat) throw new BadRequestException('Invalid category for this project');
    }

    if (parentId == null && dto.type === TaskType.TASK) {
      throw new BadRequestException('Type TASK is only for items under a ticket');
    }

    const task = await this.taskRepo.save(
      this.taskRepo.create({
        projectId,
        parentId,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        type: dto.type,
        statusId: dto.statusId,
        categoryId: dto.categoryId ?? null,
        assigneeId: dto.assigneeId ?? null,
        reporterId: actor.id,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
    const full = await this.taskRepo.findOne({
      where: { id: task.id },
      relations: { assignee: true, reporter: true, status: true, category: true },
    });
    return this.serializeTask(full!);
  }

  async updateTask(
    actor: User,
    projectId: number,
    taskId: number,
    dto: UpdateTaskDto,
  ) {
    const project = await this.assertProjectAccess(actor, projectId);
    const manager = this.isProjectTaskManager(actor, project);

    const task = await this.taskRepo.findOne({
      where: { id: taskId, projectId },
      relations: { status: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (!manager) {
      if (dto.type !== undefined || dto.categoryId !== undefined || dto.sortOrder !== undefined) {
        throw new ForbiddenException('Only the team lead or an admin can change type, category, or order');
      }
    }

    const currentStatusId = Number(task.statusId);
    const nextStatusId =
      dto.statusId !== undefined && dto.statusId !== null
        ? Number(dto.statusId)
        : null;
    if (
      nextStatusId != null &&
      !Number.isNaN(nextStatusId) &&
      nextStatusId !== currentStatusId
    ) {
      await this.assertTransitionAllowed(projectId, currentStatusId, nextStatusId);
      const st = await this.statusRepo.findOne({
        where: { id: nextStatusId, projectId },
      });
      if (!st) throw new BadRequestException('Invalid status for this project');
      task.statusId = nextStatusId;
    }

    if (dto.assigneeId !== undefined) {
      const aid =
        dto.assigneeId === null ? null : Number(dto.assigneeId);
      if (aid != null) {
        if (Number.isNaN(aid)) throw new BadRequestException('Invalid assignee');
        await this.assertUserIsMember(projectId, aid);
      }
      task.assigneeId = aid;
    }

    if (manager && dto.categoryId !== undefined) {
      if (dto.categoryId != null) {
        const cat = await this.categoryRepo.findOne({
          where: { id: dto.categoryId, projectId },
        });
        if (!cat) throw new BadRequestException('Invalid category for this project');
      }
      task.categoryId = dto.categoryId;
    }

    if (dto.title != null) task.title = dto.title.trim();
    if (dto.description !== undefined) {
      task.description = dto.description?.trim() ?? null;
    }
    if (manager && dto.type != null) {
      if (task.parentId == null && dto.type === TaskType.TASK) {
        throw new BadRequestException('Type TASK is only for items under a ticket');
      }
      task.type = dto.type;
    }
    if (manager && dto.sortOrder != null) task.sortOrder = dto.sortOrder;

    await this.taskRepo.save(task);
    const full = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: { assignee: true, reporter: true, status: true, category: true },
    });
    return this.serializeTask(full!);
  }

  async deleteTask(actor: User, projectId: number, taskId: number) {
    const project = await this.assertProjectAccess(actor, projectId);
    await this.assertTaskAuthoring(actor, project);
    const task = await this.taskRepo.findOne({ where: { id: taskId, projectId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.taskRepo.delete(taskId);
    return { ok: true };
  }

  async getTask(actor: User, projectId: number, taskId: number) {
    await this.assertProjectAccess(actor, projectId);
    const task = await this.taskRepo.findOne({
      where: { id: taskId, projectId },
      relations: { assignee: true, reporter: true, status: true, category: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return this.serializeTask(task);
  }

  async listAssignableUsers(actor: User, projectId: number) {
    await this.assertProjectAccess(actor, projectId);
    const project = await this.loadProject(projectId);
    const memberRows = await this.memberRepo.find({
      where: { projectId },
      select: { userId: true },
    });
    const ids = new Set(memberRows.map(m => m.userId));
    ids.add(project.teamLeadId);
    const users = await this.usersService.findByIds([...ids]);
    return users.map(u => this.pickUser(u));
  }
}
