import { Routes } from '@angular/router';
import {
  authGuard,
  dashboardRootRedirectGuard,
  redirectAdminFromMemberDashboardGuard,
  teamLeadWorkspaceGuard,
  memberWorkspaceGuard,
} from '../../core/guards/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [
      authGuard,
      redirectAdminFromMemberDashboardGuard,
      dashboardRootRedirectGuard,
    ],
    children: [
      {
        path: 'lead',
        canActivate: [teamLeadWorkspaceGuard],
        loadComponent: () =>
          import('./team-lead-workspace-layout.component').then(
            m => m.TeamLeadWorkspaceLayoutComponent,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./team-lead-home.component').then(m => m.TeamLeadHomeComponent),
          },
          {
            path: 'projects',
            loadComponent: () =>
              import('./project-list.component').then(m => m.ProjectListComponent),
          },
          {
            path: 'projects/:id',
            loadComponent: () =>
              import('../projects/project-detail.component').then(m => m.ProjectDetailComponent),
          },
        ],
      },
      {
        path: 'member',
        canActivate: [memberWorkspaceGuard],
        loadComponent: () =>
          import('./member-workspace-layout.component').then(m => m.MemberWorkspaceLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./member-home.component').then(m => m.MemberHomeComponent),
          },
          {
            path: 'projects',
            loadComponent: () =>
              import('./project-list.component').then(m => m.ProjectListComponent),
          },
          {
            path: 'projects/:id',
            loadComponent: () =>
              import('../projects/project-detail.component').then(m => m.ProjectDetailComponent),
          },
        ],
      },
    ],
  },
];
