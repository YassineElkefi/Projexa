import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient, private router: Router) {
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
    this.http.post(`${this.API}/logout`, {}).subscribe();
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
    return this.http.get<User>(`${this.API}/me`).pipe(
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