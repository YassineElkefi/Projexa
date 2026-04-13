import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: number;
  message: string;
  type: string;
  payload: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  project_assigned: 'folder_special',
  member_added: 'person_add',
  member_removed: 'person_remove',
  task_assigned: 'task_alt',
  task_status_changed: 'swap_horiz',
  status_updated: 'tune',
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead).length,
  );

  /** Tracks which user the service is currently initialized for */
  private currentUserId: number | null = null;

  /**
   * Completing this subject cancels any previous socket subscriptions
   * so they don't stack across user sessions.
   */
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService,
  ) {}

  /**
   * Called by NotificationBellComponent.ngOnInit().
   * Safe to call multiple times — re-initializes only when the logged-in user changes.
   */
  init(): void {
    const userId = this.authService.currentUser?.id ?? null;

    if (!userId) return;

    // Same user already initialized → nothing to do
    if (this.currentUserId === userId) return;

    // ── New user (or first login after logout) ────────────────────
    // Cancel previous socket subscription
    this.destroy$.next();

    // Reset state
    this._notifications.set([]);
    this.currentUserId = userId;

    // Connect (no-op if already connected for this user)
    this.socketService.connect();

    // Fetch persisted history for this user
    this.loadHistory();

    // Listen for live notifications — scoped to this session
    this.socketService
      .on<AppNotification>('notification')
      .pipe(takeUntil(this.destroy$))
      .subscribe(notif => {
        this._notifications.update(prev => [notif, ...prev]);
      });
  }

  /** Call on logout to clean up */
  teardown(): void {
    this.destroy$.next();
    this.socketService.disconnect();
    this._notifications.set([]);
    this.currentUserId = null;
  }

  private loadHistory(): void {
    this.http
      .get<AppNotification[]>(`${environment.apiUrl}/notifications`)
      .subscribe({
        next: list => this._notifications.set(list),
        error: () => {},
      });
  }

  markRead(id: number): void {
    this._notifications.update(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    );
    this.http.patch(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe();
  }

  markAllRead(): void {
    this._notifications.update(prev => prev.map(n => ({ ...n, isRead: true })));
    this.http.patch(`${environment.apiUrl}/notifications/read-all`, {}).subscribe();
  }

  iconFor(type: string): string {
    return TYPE_ICONS[type] ?? 'notifications';
  }
}
