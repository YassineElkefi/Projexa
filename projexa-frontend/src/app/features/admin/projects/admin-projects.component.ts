import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService, ProjectSummary } from '../../../core/services/project.service';
import { AdminUserService } from '../services/admin-user.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-projects.component.html',
  styleUrl: './admin-projects.component.scss',
})
export class AdminProjectsComponent implements OnInit {
  private projects = inject(ProjectService);
  private users = inject(AdminUserService);
  private alert = inject(AlertService);

  name = signal('');
  description = signal('');
  teamLeadId = signal<number | null>(null);
  leadOptions = signal<{ id: number; label: string }[]>([]);
  rows = signal<ProjectSummary[]>([]);
  saving = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.refreshList();
    this.users.getUsers({ page: 1, pageSize: 200 }).subscribe({
      next: res => {
        const opts = res.data
          .filter(u => u.status === 'ACTIVE' && (u.role === 'TEAM_LEAD' || u.role === 'ADMIN'))
          .map(u => ({
            id: u.id,
            label: `${u.firstName} ${u.lastName} (${u.email})`,
          }));
        this.leadOptions.set(opts);
        if (opts.length && this.teamLeadId() == null) {
          this.teamLeadId.set(opts[0].id);
        }
      },
      error: () => this.leadOptions.set([]),
    });
  }

  refreshList(): void {
    this.loading.set(true);
    this.projects.list().subscribe({
      next: data => {
        this.rows.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const n = this.name().trim();
    const lead = this.teamLeadId();
    if (!n || lead == null) {
      this.error.set('Name and team lead are required');
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    this.projects
      .create({
        name: n,
        description: this.description().trim() || undefined,
        teamLeadId: lead,
      })
      .subscribe({
        next: () => {
          this.name.set('');
          this.description.set('');
          this.saving.set(false);
          this.refreshList();
          this.alert.success('Project created successfully');
        },
        error: err => {
          this.saving.set(false);
          const msg = err?.error?.message;
          const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'Could not create project';
          this.error.set(finalMsg);
          this.alert.error(finalMsg, 'Creation Failed');
        },
      });
  }
}
