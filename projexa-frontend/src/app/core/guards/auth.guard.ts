import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
        router.navigate(['/dashboard']);
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