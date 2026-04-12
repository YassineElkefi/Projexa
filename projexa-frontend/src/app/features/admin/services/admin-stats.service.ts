import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActivityItem } from '../dashboard/widgets/activity-feed.component';

export interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  openTasks: number;
  bannedUsers: number;
  userGrowth: number;
  projectGrowth: number;
  taskGrowth: number;
}

export interface AdminStatsResponse {
  stats: AdminStats;
  activity: ActivityItem[];
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin`;

  getStats(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.API}/stats`);
  }
}