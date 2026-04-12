import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface ActivityItem {
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  activity: ActivityItem[] = [
    { message: 'New user registered',        time: '2 min ago',  type: 'success' },
    { message: 'Password reset requested',   time: '14 min ago', type: 'warning' },
    { message: 'Admin logged in',            time: '1 hr ago',   type: 'info'    },
    { message: 'Email verification sent',    time: '2 hr ago',   type: 'info'    },
    { message: 'User role updated to admin', time: '5 hr ago',   type: 'success' },
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  get userName(): string {
    return this.authService.currentUser?.firstName ?? '';
  }

  get userRole(): string {
    return this.authService.currentUser?.role ?? '';
  }

  logout(): void {
    this.authService.logout();
  }
}