import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // ✅ FIX 1: Use HttpBackend to bypass the authInterceptor for all auth calls
  // This breaks the circular dependency: AuthService → HttpClient → authInterceptor → AuthService
  private http = new HttpClient(inject(HttpBackend));

  constructor(private router: Router) {
    // ✅ FIX 2: loadUserFromStorage is now safe because this.http bypasses the interceptor
    this.loadUserFromStorage();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  register(data: { email: string; password: string; firstName?: string; lastName?: string }): Observable<any> {
    return this.http.post(`${this.API}/register`, data);
  }

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.API}/login`, { email, password }).pipe(
      tap(tokens => this.saveTokens(tokens)),
      tap(() => this.fetchCurrentUser().subscribe()),
    );
  }

  logout(): void {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // ✅ Send both tokens — backend needs access token to auth the request
    // and refresh token to invalidate the session
    this.http.post(`${this.API}/logout`, 
      { refreshToken },  // ✅ send refresh token in body so backend can blacklist it
      { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
    ).subscribe({
      error: () => {} // ✅ silently ignore — we clear locally regardless
    });

    // ✅ Always clear locally, don't wait for server response
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  refreshTokens(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthTokens>(`${this.API}/refresh`, {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }).pipe(tap(tokens => this.saveTokens(tokens)));
  }

  fetchCurrentUser(): Observable<User> {
    // ✅ FIX 4: Manually attach access token since interceptor is bypassed on this.http
    const accessToken = this.getAccessToken();
    return this.http.get<User>(`${this.API}/me`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }).pipe(
      tap(user => this.currentUserSubject.next(user)),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private saveTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private loadUserFromStorage(): void {
    if (this.isLoggedIn) {
      this.fetchCurrentUser().subscribe();
    }
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.API}/verify-email`, { params: { token } });
  }
}