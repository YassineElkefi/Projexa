import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TaskType =
  | 'BUG'
  | 'FEATURE'
  | 'USER_STORY'
  | 'TICKET'
  | 'EPIC'
  | 'TASK';

export interface ProjectSummary {
  id: number;
  name: string;
  description: string | null;
  teamLeadId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  teamLead?: ProjectUserRef;
}

export interface ProjectUserRef {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
}

export interface ProjectMemberRow {
  id: number;
  userId: number;
  createdAt: string;
  user: ProjectUserRef;
}

export interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatus {
  id: number;
  projectId: number;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusTransition {
  id: number;
  projectId: number;
  fromStatusId: number;
  toStatusId: number;
}

export interface ProjectDetailResponse {
  project: ProjectSummary & { teamLead?: ProjectUserRef; createdBy?: ProjectUserRef };
  members: ProjectMemberRow[];
  categories: ProjectCategory[];
  statuses: ProjectStatus[];
  transitions: StatusTransition[];
}

/** Body for PATCH /projects/:id/tasks/:taskId */
export type TaskUpdatePayload = Partial<{
  title: string;
  description: string | null;
  type: TaskType;
  statusId: number;
  categoryId: number | null;
  assigneeId: number | null;
  sortOrder: number;
}>;

export interface TaskDto {
  id: number;
  projectId: number;
  parentId: number | null;
  title: string;
  description: string | null;
  type: TaskType;
  statusId: number;
  categoryId: number | null;
  assigneeId: number | null;
  reporterId: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  status?: { id: number; name: string; isClosed: boolean };
  category?: { id: number; name: string; color: string | null } | null;
  assignee: ProjectUserRef | null;
  reporter?: ProjectUserRef;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/projects`;

  list(): Observable<ProjectSummary[]> {
    return this.http.get<ProjectSummary[]>(this.base);
  }

  create(body: { name: string; description?: string; teamLeadId: number }): Observable<ProjectSummary> {
    return this.http.post<ProjectSummary>(this.base, body);
  }

  detail(projectId: number): Observable<ProjectDetailResponse> {
    return this.http.get<ProjectDetailResponse>(`${this.base}/${projectId}/detail`);
  }

  update(
    projectId: number,
    body: { name?: string; description?: string | null; teamLeadId?: number },
  ): Observable<ProjectSummary> {
    return this.http.patch<ProjectSummary>(`${this.base}/${projectId}`, body);
  }

  addMember(projectId: number, body: { userId?: number; email?: string }): Observable<ProjectDetailResponse> {
    return this.http.post<ProjectDetailResponse>(`${this.base}/${projectId}/members`, body);
  }

  removeMember(projectId: number, userId: number): Observable<ProjectDetailResponse> {
    return this.http.delete<ProjectDetailResponse>(`${this.base}/${projectId}/members/${userId}`);
  }

  assignable(projectId: number): Observable<ProjectUserRef[]> {
    return this.http.get<ProjectUserRef[]>(`${this.base}/${projectId}/members/assignable`);
  }

  listTasks(projectId: number, opts?: { parentId?: number; scope?: 'all' }): Observable<TaskDto[]> {
    let url = `${this.base}/${projectId}/tasks`;
    const params: string[] = [];
    if (opts?.scope === 'all') params.push('scope=all');
    if (opts?.parentId != null) params.push(`parentId=${opts.parentId}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<TaskDto[]>(url);
  }

  getTask(projectId: number, taskId: number): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.base}/${projectId}/tasks/${taskId}`);
  }

  createTask(
    projectId: number,
    body: {
      title: string;
      description?: string | null;
      type: TaskType;
      statusId: number;
      categoryId?: number | null;
      parentId?: number | null;
      assigneeId?: number | null;
      sortOrder?: number;
    },
  ): Observable<TaskDto> {
    return this.http.post<TaskDto>(`${this.base}/${projectId}/tasks`, body);
  }

  updateTask(projectId: number, taskId: number, body: TaskUpdatePayload): Observable<TaskDto> {
    return this.http.patch<TaskDto>(`${this.base}/${projectId}/tasks/${taskId}`, body);
  }

  deleteTask(projectId: number, taskId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${projectId}/tasks/${taskId}`);
  }

  replaceTransitions(
    projectId: number,
    edges: { fromStatusId: number; toStatusId: number }[],
  ): Observable<ProjectDetailResponse> {
    return this.http.put<ProjectDetailResponse>(`${this.base}/${projectId}/status-transitions`, { edges });
  }

  createCategory(projectId: number, body: { name: string; color?: string | null }): Observable<ProjectDetailResponse> {
    return this.http.post<ProjectDetailResponse>(`${this.base}/${projectId}/categories`, body);
  }

  createStatus(
    projectId: number,
    body: { name: string; sortOrder?: number; isDefault?: boolean; isClosed?: boolean },
  ): Observable<ProjectDetailResponse> {
    return this.http.post<ProjectDetailResponse>(`${this.base}/${projectId}/statuses`, body);
  }
}
