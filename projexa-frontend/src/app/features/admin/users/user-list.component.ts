import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AdminUserService, AdminUser, UserFilters, UserRole, UserStatus } from '../services/admin-user.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private userService = inject(AdminUserService);
  private route       = inject(ActivatedRoute);

  users      = signal<AdminUser[]>([]);
  total      = signal(0);
  loading    = signal(true);
  actionId   = signal<number | null>(null); // tracks which user row is processing

  // Filters
  search     = signal('');
  roleFilter = signal<UserRole | ''>('');
  statusFilter = signal<UserStatus | ''>('');
  page       = signal(1);
  pageSize   = 10;

  createOpen = signal(false);
  createBusy = signal(false);
  createError = signal<string | null>(null);
  cEmail = signal('');
  cPassword = signal('');
  cFirst = signal('');
  cLast = signal('');
  cRole = signal<UserRole>('MEMBER');

  private search$ = new Subject<string>();

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.page.set(1);
      this.fetchUsers();
    });
  }

  ngOnInit(): void {
    // Support ?filter=banned from dashboard quick actions
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'banned') {
        this.statusFilter.set('BANNED');
      }
      this.fetchUsers();
    });
  }

  fetchUsers(): void {
    this.loading.set(true);
    const filters: UserFilters = {
      search:   this.search(),
      role:     this.roleFilter(),
      status:   this.statusFilter(),
      page:     this.page(),
      pageSize: this.pageSize,
    };
    this.userService.getUsers(filters).subscribe({
      next: res => {
        this.users.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchInput(value: string): void {
    this.search.set(value);
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.fetchUsers();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.fetchUsers();
  }

  toggleBan(user: AdminUser): void {
    this.actionId.set(user.id);
    const action = user.status === 'BANNED'
      ? this.userService.unbanUser(user.id)
      : this.userService.banUser(user.id);

    action.subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
    });
  }

  approveUser(user: AdminUser): void {
    if (user.status !== 'PENDING') return;
    this.actionId.set(user.id);
    this.userService.activateUser(user.id).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
    });
  }

  changeRole(user: AdminUser, role: UserRole): void {
    this.actionId.set(user.id);
    this.userService.updateRole(user.id, role).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.actionId.set(null);
      },
      error: () => this.actionId.set(null),
    });
  }

  roleOptions: { value: UserRole | ''; label: string }[] = [
    { value: '', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'TEAM_LEAD', label: 'Team Lead' },
    { value: 'MEMBER', label: 'Member' },
  ];

  statusOptions: { value: UserStatus | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'BANNED', label: 'Banned' },
    { value: 'PENDING', label: 'Pending' },
  ];

  openCreate(): void {
    this.createError.set(null);
    this.createOpen.set(true);
  }

  closeCreate(): void {
    this.createOpen.set(false);
  }

  submitCreate(): void {
    const email = this.cEmail().trim();
    const password = this.cPassword();
    const firstName = this.cFirst().trim();
    const lastName = this.cLast().trim();
    if (!email || !password || password.length < 8 || !firstName || !lastName) {
      this.createError.set('Fill all fields; password must be at least 8 characters.');
      return;
    }
    this.createError.set(null);
    this.createBusy.set(true);
    this.userService
      .createUser({
        email,
        password,
        firstName,
        lastName,
        role: this.cRole(),
      })
      .subscribe({
        next: () => {
          this.createBusy.set(false);
          this.createOpen.set(false);
          this.cEmail.set('');
          this.cPassword.set('');
          this.cFirst.set('');
          this.cLast.set('');
          this.cRole.set('MEMBER');
          this.fetchUsers();
        },
        error: err => {
          this.createBusy.set(false);
          const msg = err?.error?.message;
          this.createError.set(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not create user');
        },
      });
  }
}