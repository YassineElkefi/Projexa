import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-team-lead-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-lead-home.component.html',
  styleUrl: './team-lead-home.component.scss',
})
export class TeamLeadHomeComponent implements OnInit {
  private projects = inject(ProjectService);
  auth = inject(AuthService);

  projectCount = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    this.projects.list().subscribe({
      next: rows => {
        this.projectCount.set(rows.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get userName(): string {
    return this.auth.currentUser?.firstName ?? '';
  }
}
