import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-list.component').then(m => m.UserListComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./users/user-detail.component').then(m => m.UserDetailComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/system-settings.component').then(m => m.SystemSettingsComponent),
      },
    ],
  },
];