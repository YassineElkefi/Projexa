import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCardComponent } from './widgets/stat-card.component';
import { ActivityFeedComponent, ActivityItem } from './widgets/activity-feed.component';
import { AdminStatsService, AdminStats } from '../services/admin-stats.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent, ActivityFeedComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private statsService = inject(AdminStatsService);

  stats   = signal<AdminStats | null>(null);
  activity = signal<ActivityItem[]>([]);
  loading  = signal(true);

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: data => {
        this.stats.set(data.stats);
        this.activity.set(data.activity);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}