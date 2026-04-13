import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../../../core/components/notification-bell/notification-bell.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);
  private alert = inject(AlertService);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.resolveTitle(this.router.url)),
    ),
    { initialValue: this.resolveTitle(this.router.url) },
  );

  private resolveTitle(url: string): string {
    if (url.includes('/users')) return 'User Management';
    if (url.includes('/settings')) return 'System Settings';
    return 'Dashboard';
  }

  logout(): void {
    this.alert.confirm('You will be logged out of your account.', 'Are you sure?').then(result => {
      if (result.isConfirmed) {
        this.auth.logout();
      }
    });
  }
}