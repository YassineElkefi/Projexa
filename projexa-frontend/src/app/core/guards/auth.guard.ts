import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/** Non-admin app area: team leads and members use different dashboard segments. */
export function workspaceDashboardPath(role: string | undefined | null): '/dashboard/lead' | '/dashboard/member' {
  return role === 'TEAM_LEAD' ? '/dashboard/lead' : '/dashboard/member';
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return auth.currentUser$.pipe(
    filter(user => user !== null),
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }),
  );
};

/** Use this guard on the post-login redirect route */
export const roleRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  const user$ = auth.currentUser ? of(auth.currentUser) : auth.fetchCurrentUser();

  return user$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }
      if (user.role === 'ADMIN') {
        router.navigate(['/admin']);
      } else {
        router.navigate([workspaceDashboardPath(user.role)]);
      }
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};

/** Keep admins out of the member dashboard; they belong under /admin. */
export const redirectAdminFromMemberDashboardGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser?.role === 'ADMIN') {
    router.navigate(['/admin']);
    return false;
  }
  return true;
};

/** `/dashboard` → `/dashboard/lead` or `/dashboard/member` */
export const dashboardRootRedirectGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const path = state.url.split('?')[0].replace(/\/$/, '') || '/';
  if (path === '/dashboard') {
    return router.createUrlTree([workspaceDashboardPath(auth.currentUser?.role)]);
  }
  return true;
};

export const teamLeadWorkspaceGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.currentUser?.role !== 'TEAM_LEAD') {
    return router.createUrlTree([workspaceDashboardPath(auth.currentUser?.role)]);
  }
  return true;
};

export const memberWorkspaceGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.currentUser?.role !== 'MEMBER') {
    return router.createUrlTree([workspaceDashboardPath(auth.currentUser?.role)]);
  }
  return true;
};