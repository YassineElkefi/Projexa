import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBellComponent } from '../../core/components/notification-bell/notification-bell.component';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-member-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NotificationBellComponent],
  templateUrl: './member-workspace-layout.component.html',
  styleUrl: './member-workspace-layout.component.scss',
})
export class MemberWorkspaceLayoutComponent {
  auth = inject(AuthService);
  private alert = inject(AlertService);

  get userName(): string {
    return this.auth.currentUser?.firstName ?? '';
  }

  logout(): void {
    this.alert.confirm('You will be logged out of your account.', 'Are you sure?').then(result => {
      if (result.isConfirmed) {
        this.auth.logout();
      }
    });
  }
}
