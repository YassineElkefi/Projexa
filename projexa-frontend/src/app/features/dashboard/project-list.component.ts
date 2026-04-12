import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService, ProjectSummary } from '../../core/services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {
  private projectsApi = inject(ProjectService);
  private router = inject(Router);

  rows = signal<ProjectSummary[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.projectsApi.list().subscribe({
      next: data => {
        this.rows.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get base(): string {
    if (this.router.url.includes('/admin')) return '/admin';
    const m = this.router.url.match(/\/dashboard\/(lead|member)/);
    return m ? `/dashboard/${m[1]}` : '/dashboard/member';
  }
}
