import { Routes } from '@angular/router';
import { authGuard, redirectAdminFromMemberDashboardGuard } from '../../core/guards/auth.guard';

// Placeholder dashboard component — replace with your real one
// or point each child at an existing component you already have
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, redirectAdminFromMemberDashboardGuard],
    // Replace this loadComponent with your real dashboard shell once you build it
    loadComponent: () =>
      import('./dashboard.component').then(m => m.DashboardComponent),
  },
];