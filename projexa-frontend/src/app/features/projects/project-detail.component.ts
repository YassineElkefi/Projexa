import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ProjectService,
  ProjectDetailResponse,
  TaskDto,
  TaskType,
  TaskUpdatePayload,
  ProjectStatus,
} from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminUserService } from '../admin/services/admin-user.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projects = inject(ProjectService);
  auth = inject(AuthService);
  private adminUsers = inject(AdminUserService);

  projectId = signal<number | null>(null);
  detail = signal<ProjectDetailResponse | null>(null);
  rootTickets = signal<TaskDto[]>([]);
  childTasks = signal<Record<number, TaskDto[]>>({});
  assignable = signal<{ id: number; firstName: string; lastName: string; email: string }[]>([]);
  leadOptions = signal<{ id: number; label: string }[]>([]);

  loading = signal(true);
  saving = signal(false);
  inviteEmail = signal('');
  newTaskTitle = signal('');
  newTaskType = signal<TaskType>('TICKET');
  newTaskStatusId = signal<number | null>(null);
  newTaskCategoryId = signal<number | null>(null);
  newTaskAssigneeId = signal<number | null>(null);
  newTaskParentId = signal<number | null>(null);
  newCategoryName = signal('');
  expandedParents = signal<Set<number>>(new Set());

  /** Right-hand panel: ticket (root) or task (child) details */
  detailPanelTask = signal<TaskDto | null>(null);
  detailPanelLoading = signal(false);
  tablePatchError = signal<string | null>(null);

  taskTypes: TaskType[] = ['BUG', 'FEATURE', 'USER_STORY', 'TICKET', 'EPIC', 'TASK'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.router.navigateByUrl(this.listPath);
      return;
    }
    this.projectId.set(id);
    if (this.isAdmin) {
      this.adminUsers.getUsers({ page: 1, pageSize: 200 }).subscribe({
        next: res => {
          const leads = res.data
            .filter(u => u.status === 'ACTIVE' && (u.role === 'TEAM_LEAD' || u.role === 'ADMIN'))
            .map(u => ({
              id: u.id,
              label: `${u.firstName} ${u.lastName} (${u.email})`,
            }));
          this.leadOptions.set(leads);
        },
        error: () => this.leadOptions.set([]),
      });
    }
    this.reloadAll(id);
  }

  private applyDetail(det: ProjectDetailResponse): void {
    this.detail.set(this.normalizeDetail(det));
  }

  get base(): string {
    if (this.router.url.includes('/admin')) return '/admin';
    const m = this.router.url.match(/\/dashboard\/(lead|member)/);
    return m ? `/dashboard/${m[1]}` : '/dashboard/member';
  }

  get listPath(): string {
    return `${this.base}/projects`;
  }

  get isAdmin(): boolean {
    return this.auth.currentUser?.role === 'ADMIN';
  }

  /** Admin or this project’s team lead: members, workflow, create/delete tickets/tasks. */
  canManageProject = computed(() => {
    const u = this.auth.currentUser;
    const d = this.detail();
    if (!u || !d) return false;
    if (u.role === 'ADMIN') return true;
    return d.project.teamLeadId === u.id;
  });

  /** Anyone who can open the project may update ticket fields (status, assignee, title, description). */
  canEditTasks = computed(() => !!this.detail());

  panelIsTicket = computed(() => {
    const t = this.detailPanelTask();
    return t != null && (t.parentId == null || t.parentId === 0);
  });

  /** Coerce numeric ids from the detail payload so ngModel/ngValue match and workflow filters work. */
  normalizeDetail(det: ProjectDetailResponse): ProjectDetailResponse {
    return {
      ...det,
      project: {
        ...det.project,
        id: Number(det.project.id),
        teamLeadId: Number(det.project.teamLeadId),
        createdById: Number(det.project.createdById),
      },
      members: det.members.map(m => ({
        ...m,
        id: Number(m.id),
        userId: Number(m.userId),
      })),
      categories: det.categories.map(c => ({
        ...c,
        id: Number(c.id),
        projectId: Number(c.projectId),
      })),
      statuses: det.statuses.map(s => ({
        ...s,
        id: Number(s.id),
        projectId: Number(s.projectId),
      })),
      transitions: det.transitions.map(t => ({
        ...t,
        id: Number(t.id),
        projectId: Number(t.projectId),
        fromStatusId: Number(t.fromStatusId),
        toStatusId: Number(t.toStatusId),
      })),
    };
  }

  /** Coerce API ids (MySQL may return strings) so selects and transition filters stay in sync. */
  normalizeTaskDto(t: TaskDto): TaskDto {
    return {
      ...t,
      id: Number(t.id),
      projectId: Number(t.projectId),
      parentId: t.parentId != null ? Number(t.parentId) : null,
      statusId: Number(t.statusId),
      categoryId: t.categoryId != null ? Number(t.categoryId) : null,
      assigneeId: t.assigneeId != null ? Number(t.assigneeId) : null,
      reporterId: Number(t.reporterId),
    };
  }

  defaultStatusId(): number | null {
    const d = this.detail();
    if (!d) return null;
    const def = d.statuses.find(s => s.isDefault);
    if (def) return Number(def.id);
    const sorted = [...d.statuses].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0] != null ? Number(sorted[0].id) : null;
  }

  reloadAll(projectId: number): void {
    this.loading.set(true);
    this.projects.detail(projectId).subscribe({
      next: det => {
        this.applyDetail(det);
        if (this.isAdmin && det.project.teamLead) {
          this.leadOptions.update(opts => {
            if (opts.some(o => o.id === det.project.teamLeadId)) return opts;
            const tl = det.project.teamLead!;
            return [
              {
                id: det.project.teamLeadId,
                label: `${tl.firstName} ${tl.lastName} (${tl.email})`,
              },
              ...opts,
            ];
          });
        }
        const def = det.statuses.find(s => s.isDefault)?.id ?? det.statuses[0]?.id ?? null;
        this.newTaskStatusId.set(def != null ? Number(def) : null);
        const cat = det.categories[0]?.id ?? null;
        this.newTaskCategoryId.set(cat != null ? Number(cat) : null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.listPath);
      },
    });
    this.projects.listTasks(projectId).subscribe({
      next: t => this.rootTickets.set(t.map(x => this.normalizeTaskDto(x))),
      error: () => this.rootTickets.set([]),
    });
    this.projects.assignable(projectId).subscribe({
      next: u => this.assignable.set(u),
      error: () => this.assignable.set([]),
    });
  }

  refreshDetail(): void {
    const id = this.projectId();
    if (id == null) return;
    this.projects.detail(id).subscribe({ next: d => this.applyDetail(d) });
  }

  refreshTasks(): void {
    const id = this.projectId();
    if (id == null) return;
    this.projects
      .listTasks(id)
      .subscribe({ next: t => this.rootTickets.set(t.map(x => this.normalizeTaskDto(x))) });
    const ex = new Set(this.expandedParents());
    ex.forEach(pid => this.loadChildTasks(pid));
  }

  loadChildTasks(parentId: number): void {
    const id = this.projectId();
    if (id == null) return;
    this.projects.listTasks(id, { parentId }).subscribe({
      next: rows => {
        const norm = rows.map(x => this.normalizeTaskDto(x));
        this.childTasks.update(m => ({ ...m, [parentId]: norm }));
      },
    });
  }

  toggleExpand(ticketId: number): void {
    const s = new Set(this.expandedParents());
    if (s.has(ticketId)) {
      s.delete(ticketId);
    } else {
      s.add(ticketId);
      this.loadChildTasks(ticketId);
    }
    this.expandedParents.set(s);
  }

  isExpanded(ticketId: number): boolean {
    return this.expandedParents().has(ticketId);
  }

  childTasksFor(ticketId: number): TaskDto[] {
    return this.childTasks()[ticketId] ?? [];
  }

  statusOptionsFor(task: TaskDto): ProjectStatus[] {
    const d = this.detail();
    if (!d) return [];
    const cur = Number(task.statusId);
    if (d.transitions.length === 0) return d.statuses;
    const next = new Set(
      d.transitions
        .filter(tr => Number(tr.fromStatusId) === cur)
        .map(tr => Number(tr.toStatusId)),
    );
    const list = d.statuses.filter(
      s => Number(s.id) === cur || next.has(Number(s.id)),
    );
    return list;
  }

  transitionLabel(fromId: number, toId: number): string {
    const d = this.detail();
    if (!d) return '';
    const a = d.statuses.find(s => Number(s.id) === Number(fromId))?.name ?? '?';
    const b = d.statuses.find(s => Number(s.id) === Number(toId))?.name ?? '?';
    return `${a} → ${b}`;
  }

  openTicketDetail(task: TaskDto): void {
    const pid = this.projectId();
    if (pid == null) return;
    this.tablePatchError.set(null);
    this.detailPanelTask.set(this.normalizeTaskDto(task));
    this.detailPanelLoading.set(true);
    this.projects.getTask(pid, task.id).subscribe({
      next: row => {
        this.detailPanelTask.set(this.normalizeTaskDto(row));
        this.detailPanelLoading.set(false);
      },
      error: () => {
        this.detailPanelLoading.set(false);
      },
    });
  }

  closeTicketDetail(): void {
    this.detailPanelTask.set(null);
    this.detailPanelLoading.set(false);
    this.tablePatchError.set(null);
  }

  saveTicketDetail(): void {
    const pid = this.projectId();
    const t = this.detailPanelTask();
    if (pid == null || t == null || !this.canEditTasks()) return;
    const title = t.title?.trim();
    if (!title) return;

    this.saving.set(true);
    this.tablePatchError.set(null);

    const body: TaskUpdatePayload = {
      title,
      description: t.description ?? null,
      statusId: Number(t.statusId),
      assigneeId: t.assigneeId == null ? null : Number(t.assigneeId),
    };

    if (this.canManageProject()) {
      body.type = t.type;
      body.categoryId = t.categoryId == null ? null : Number(t.categoryId);
    }

    this.projects.updateTask(pid, t.id, body).subscribe({
      next: upd => {
        this.detailPanelTask.set(this.normalizeTaskDto(upd));
        this.refreshTasks();
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        const msg = err?.error?.message;
        this.tablePatchError.set(
          Array.isArray(msg) ? msg.join(', ') : msg || 'Save failed',
        );
      },
    });
  }

  addMember(): void {
    const id = this.projectId();
    const email = this.inviteEmail().trim();
    if (id == null || !email || !this.canManageProject()) return;
    this.saving.set(true);
    this.projects.addMember(id, { email }).subscribe({
      next: d => {
        this.applyDetail(d);
        this.inviteEmail.set('');
        this.projects.assignable(id).subscribe({ next: u => this.assignable.set(u) });
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  removeMember(userId: number): void {
    const id = this.projectId();
    if (id == null || !this.canManageProject()) return;
    this.saving.set(true);
    this.projects.removeMember(id, userId).subscribe({
      next: d => {
        this.applyDetail(d);
        this.projects.assignable(id).subscribe({ next: u => this.assignable.set(u) });
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  onTeamLeadChange(userId: number): void {
    const id = this.projectId();
    if (id == null || !this.isAdmin) return;
    this.saving.set(true);
    this.projects.update(id, { teamLeadId: userId }).subscribe({
      next: () => {
        this.refreshDetail();
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  createTask(): void {
    const id = this.projectId();
    const title = this.newTaskTitle().trim();
    const st = this.newTaskStatusId();
    if (id == null || !title || st == null || !this.canManageProject()) return;
    this.saving.set(true);
    this.projects
      .createTask(id, {
        title,
        type: this.newTaskType(),
        statusId: Number(st),
        categoryId: this.newTaskCategoryId(),
        assigneeId: this.newTaskAssigneeId(),
        parentId: this.newTaskParentId(),
      })
      .subscribe({
        next: () => {
          this.newTaskTitle.set('');
          this.newTaskParentId.set(null);
          this.refreshTasks();
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  updateTaskRow(task: TaskDto, patch: Partial<TaskUpdatePayload>): void {
  const id = this.projectId();
  if (id == null || !this.canEditTasks()) return;

  // 1. Optimistically update the local signal so statusOptionsFor()
  //    sees the NEW statusId immediately when re-rendering the select.
  const updatedTask = { ...task, ...patch };
  this.rootTickets.update(rows =>
    rows.map(r => (r.id === task.id ? { ...r, ...patch } : r)),
  );
  // Also update child tasks if applicable
  if (task.parentId != null) {
    this.childTasks.update(m => {
      const siblings = m[task.parentId!] ?? [];
      return {
        ...m,
        [task.parentId!]: siblings.map(r =>
          r.id === task.id ? { ...r, ...patch } : r,
        ),
      };
    });
  }

  const body: TaskUpdatePayload = {};
    if (patch.statusId !== undefined) body.statusId = Number(patch.statusId);
    if (patch.assigneeId !== undefined) {
      body.assigneeId = patch.assigneeId === null ? null : Number(patch.assigneeId);
    }

    this.tablePatchError.set(null);
    this.projects.updateTask(id, task.id, body).subscribe({
      next: () => {
        // 2. Refresh to get canonical server state (status name, etc.)
        this.refreshTasks();
        const open = this.detailPanelTask();
        if (open?.id === task.id) {
          this.projects.getTask(id, task.id).subscribe({
            next: t => this.detailPanelTask.set(this.normalizeTaskDto(t)),
          });
        }
      },
      error: err => {
        // 3. Revert optimistic update on failure
        this.rootTickets.update(rows =>
          rows.map(r => (r.id === task.id ? task : r)),
        );
        if (task.parentId != null) {
          this.childTasks.update(m => {
            const siblings = m[task.parentId!] ?? [];
            return {
              ...m,
              [task.parentId!]: siblings.map(r => (r.id === task.id ? task : r)),
            };
          });
        }
        const msg = err?.error?.message;
        this.tablePatchError.set(
          Array.isArray(msg) ? msg.join(', ') : msg || 'Update failed',
        );
      },
    });
  }

  deleteTask(task: TaskDto): void {
    const id = this.projectId();
    if (id == null || !this.canManageProject()) return;
    const kind = task.parentId ? 'task' : 'ticket';
    if (!confirm(`Delete ${kind} “${task.title}”?`)) return;
    this.projects.deleteTask(id, task.id).subscribe({
      next: () => {
        if (this.detailPanelTask()?.id === task.id) {
          this.closeTicketDetail();
        }
        this.refreshTasks();
      },
    });
  }

  addCategory(): void {
    const id = this.projectId();
    const name = this.newCategoryName().trim();
    if (id == null || !this.canManageProject() || !name) return;
    this.projects.createCategory(id, { name }).subscribe({
      next: d => {
        this.applyDetail(d);
        this.newCategoryName.set('');
      },
    });
  }

  startChildTask(parentTicketId: number): void {
    this.newTaskParentId.set(parentTicketId);
    this.newTaskType.set('TASK');
    const st = this.defaultStatusId();
    if (st != null) this.newTaskStatusId.set(st);
  }

  clearChildTaskParent(): void {
    this.newTaskParentId.set(null);
    this.newTaskType.set('TICKET');
  }

  formatTaskType(ty: string): string {
    const labels: Record<string, string> = {
      TICKET: 'Ticket',
      TASK: 'Task',
      SUB_TASK: 'Task',
      BUG: 'Bug',
      FEATURE: 'Feature',
      USER_STORY: 'User story',
      EPIC: 'Epic',
    };
    return labels[ty] ?? ty.replace(/_/g, ' ');
  }
}
