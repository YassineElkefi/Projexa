import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type UserRole   = 'ADMIN' | 'TEAM_LEAD' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'BANNED' | 'PENDING';

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface UsersResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/users`;

  getUsers(filters: UserFilters = {}): Observable<UsersResponse> {
    let params = new HttpParams();
    if (filters.search)   params = params.set('search', filters.search);
    if (filters.role)     params = params.set('role', filters.role);
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.page)     params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize);
    return this.http.get<UsersResponse>(this.API, { params });
  }

  getUser(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.API}/${id}`);
  }

  updateRole(id: number, role: UserRole): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API}/${id}/role`, { role });
  }

  banUser(id: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API}/${id}/ban`, {});
  }

  unbanUser(id: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API}/${id}/unban`, {});
  }

  activateUser(id: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API}/${id}/activate`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  createUser(body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${environment.apiUrl}/admin/users`, body);
  }
}