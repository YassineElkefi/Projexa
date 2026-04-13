import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBellComponent } from '../../core/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-team-lead-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NotificationBellComponent],
  templateUrl: './team-lead-workspace-layout.component.html',
  styleUrl: './team-lead-workspace-layout.component.scss',
})
export class TeamLeadWorkspaceLayoutComponent {
  auth = inject(AuthService);

  get userName(): string {
    return this.auth.currentUser?.firstName ?? '';
  }

  logout(): void {
    this.auth.logout();
  }
}
